'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useHousehold } from '@/lib/hooks/use-household';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { Plus, ShoppingBag, CheckCircle2, Home } from 'lucide-react';
import { addToQueue, getPendingActions, markAsSynced } from '@/lib/offline/queue';

type GroceryItemStatus = 'HOME' | 'MUST_BUY' | 'BOUGHT';

interface GroceryItem {
  id: string;
  name: string;
  quantity: string | null;
  category_id: string | null;
  status: GroceryItemStatus;
  notes: string | null;
  category?: { name: string };
}

interface GroceryCategory {
  id: string;
  name: string;
}

export default function GroceriesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShoppingMode, setShowShoppingMode] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { data: householdData } = useHousehold();
  const householdId = householdData?.household_id as string | undefined;

  // Redirect to setup if no household
  useEffect(() => {
    if (householdData && !householdId) {
      window.location.href = '/app/setup';
    }
  }, [householdData, householdId]);

  // Fetch grocery list
  const { data: groceryList } = useQuery({
    queryKey: ['grocery-list', householdId],
    queryFn: async () => {
      if (!householdId) return null;
      const { data } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('household_id', householdId)
        .single();
      return data;
    },
    enabled: !!householdId,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<GroceryCategory[]>({
    queryKey: ['grocery-categories', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data } = await supabase
        .from('grocery_categories')
        .select('*')
        .eq('household_id', householdId)
        .order('name');
      return data || [];
    },
    enabled: !!householdId,
  });

  // Fetch items
  const { data: items = [] } = useQuery<GroceryItem[]>({
    queryKey: ['grocery-items', groceryList?.id],
    queryFn: async () => {
      if (!groceryList?.id) return [];
      const { data } = await supabase
        .from('grocery_items')
        .select('*, category:grocery_categories(name)')
        .eq('list_id', groceryList.id)
        .order('created_at', { ascending: false });
      return (data || []).map((item: any) => ({
        ...item,
        category: item.category?.[0] || item.category,
      }));
    },
    enabled: !!groceryList?.id,
  });

  // Sync offline actions
  useEffect(() => {
    const syncOfflineActions = async () => {
      if (navigator.onLine) {
        const pending = await getPendingActions();
        for (const action of pending) {
          try {
            // Handle different action types
            if (action.type === 'update_item_status') {
              const { error } = await supabase
                .from('grocery_items')
                .update({ status: action.payload.status })
                .eq('id', action.payload.id);
              if (!error) await markAsSynced(action.id);
            } else if (action.type === 'create_item') {
              const { error } = await supabase
                .from('grocery_items')
                .insert(action.payload);
              if (!error) await markAsSynced(action.id);
            }
            queryClient.invalidateQueries({ queryKey: ['grocery-items'] });
          } catch (error) {
            console.error('Sync error:', error);
          }
        }
      }
    };

    syncOfflineActions();
    const interval = setInterval(syncOfflineActions, 5000);
    return () => clearInterval(interval);
  }, [supabase, queryClient]);

  const addItemMutation = useMutation({
    mutationFn: async (item: {
      name: string;
      quantity?: string;
      category_id?: string;
    }) => {
      if (!groceryList?.id) throw new Error('No list found');
      
      const payload = {
        list_id: groceryList.id,
        name: item.name,
        quantity: item.quantity || null,
        category_id: item.category_id || null,
        status: 'HOME' as GroceryItemStatus,
      };

      if (navigator.onLine) {
        const { error } = await supabase
          .from('grocery_items')
          .insert(payload);
        if (error) throw error;
      } else {
        await addToQueue({
          type: 'create_item',
          payload,
          timestamp: Date.now(),
        });
        showToast('Ajouté en mode hors-ligne, synchronisation à venir', 'info');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grocery-items'] });
      setShowAddModal(false);
      setNewItemName('');
      setNewItemQuantity('');
      setSelectedCategory('');
      showToast('Article ajouté', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur lors de l\'ajout', 'error');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: GroceryItemStatus;
    }) => {
      if (navigator.onLine) {
        const { error } = await supabase
          .from('grocery_items')
          .update({ status })
          .eq('id', id);
        if (error) throw error;
      } else {
        await addToQueue({
          type: 'update_item_status',
          payload: { id, status },
          timestamp: Date.now(),
        });
        showToast('Modifié en mode hors-ligne', 'info');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grocery-items'] });
    },
  });

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    addItemMutation.mutate({
      name: newItemName,
      quantity: newItemQuantity || undefined,
      category_id: selectedCategory || undefined,
    });
  };

  const itemsByStatus = {
    HOME: items.filter((i) => i.status === 'HOME'),
    MUST_BUY: items.filter((i) => i.status === 'MUST_BUY'),
    BOUGHT: items.filter((i) => i.status === 'BOUGHT'),
  };

  const itemsByCategory = (status: GroceryItemStatus) => {
    const filtered = items.filter((i) => i.status === status);
    const grouped: Record<string, GroceryItem[]> = {};
    filtered.forEach((item) => {
      const catName = item.category?.name || 'Sans catégorie';
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(item);
    });
    return grouped;
  };

  if (showShoppingMode) {
    const shoppingItems = itemsByCategory('MUST_BUY');
    const boughtItems = itemsByCategory('BOUGHT');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mode Course</h1>
          <Button onClick={() => setShowShoppingMode(false)} variant="secondary">
            Retour
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">À acheter</h2>
            {Object.keys(shoppingItems).length === 0 ? (
              <p className="text-gray-500">Rien à acheter</p>
            ) : (
              Object.entries(shoppingItems).map(([category, categoryItems]) => (
                <div key={category} className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">{category}</h3>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200"
                      >
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: item.id,
                              status: 'BOUGHT',
                            })
                          }
                          className="w-6 h-6 border-2 border-gray-300 rounded flex-shrink-0 hover:border-primary-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {item.quantity && (
                            <p className="text-sm text-gray-500">
                              {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {Object.keys(boughtItems).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pris</h2>
              {Object.entries(boughtItems).map(([category, categoryItems]) => (
                <div key={category} className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">{category}</h3>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
                      >
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium line-through text-gray-600">
                            {item.name}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: item.id,
                              status: 'MUST_BUY',
                            })
                          }
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          Annuler
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nos courses</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowShoppingMode(true)}
            variant="secondary"
            disabled={itemsByStatus.MUST_BUY.length === 0}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Mode Course
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Items at home */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Home className="h-5 w-5" />
          À la maison
        </h2>
        {itemsByStatus.HOME.length === 0 ? (
          <p className="text-gray-500">Aucun article</p>
        ) : (
          <div className="grid gap-2">
            {itemsByStatus.HOME.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200"
              >
                <button
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: item.id,
                      status: 'MUST_BUY',
                    })
                  }
                  className="w-5 h-5 border-2 border-gray-300 rounded hover:border-primary-500"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.quantity && (
                    <p className="text-sm text-gray-500">{item.quantity}</p>
                  )}
                  {item.category && (
                    <span className="text-xs text-gray-400">
                      {item.category.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold">Ajouter un article</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ex: Lait"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantité (optionnel)
              </label>
              <input
                type="text"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ex: 2L"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Catégorie (optionnel)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sans catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setNewItemName('');
                  setNewItemQuantity('');
                  setSelectedCategory('');
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleAddItem} disabled={!newItemName.trim()}>
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
