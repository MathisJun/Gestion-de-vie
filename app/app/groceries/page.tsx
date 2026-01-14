'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/lib/hooks/use-household';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { showToast } from '@/components/ui/Toast';
import { addToQueue, getPendingActions, markAsSynced } from '@/lib/offline/queue';

type GroceryItemStatus = 'HOME' | 'MUST_BUY' | 'BOUGHT';

interface GroceryItem {
  id: string;
  name: string;
  quantity: string | null;
  categoryId: string | null;
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
  const { data: householdData } = useHousehold();
  const householdId = householdData?.household_id as string | undefined;

  useEffect(() => {
    if (householdData && !householdId) {
      window.location.href = '/app/setup';
    }
  }, [householdData, householdId]);

  const { data: groceryData, isLoading } = useQuery<{
    items: GroceryItem[];
    categories: GroceryCategory[];
    list: { id: string; name: string } | null;
  }>({
    queryKey: ['grocery-list'],
    queryFn: async () => {
      const response = await fetch('/api/groceries');
      if (!response.ok) throw new Error('Failed to fetch groceries');
      const data = await response.json();
      return {
        items: (data.items || []).map((item: any) => ({
          ...item,
          categoryId: item.categoryId,
          category: item.category,
        })),
        categories: data.categories || [],
        list: data.list,
      };
    },
  });

  const items = groceryData?.items || [];
  const categories = groceryData?.categories || [];
  const groceryList = groceryData?.list;

  useEffect(() => {
    const syncOfflineActions = async () => {
      if (navigator.onLine) {
        const pending = await getPendingActions();
        for (const action of pending) {
          try {
            if (action.type === 'update_item_status') {
              const response = await fetch('/api/groceries', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: action.payload.id,
                  status: action.payload.status,
                }),
              });
              if (response.ok) await markAsSynced(action.id);
            } else if (action.type === 'create_item') {
              const response = await fetch('/api/groceries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(action.payload),
              });
              if (response.ok) await markAsSynced(action.id);
            }
            queryClient.invalidateQueries({ queryKey: ['grocery-list'] });
          } catch (error) {
            console.error('Sync error:', error);
          }
        }
      }
    };

    syncOfflineActions();
    const interval = setInterval(syncOfflineActions, 5000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const addItemMutation = useMutation({
    mutationFn: async (item: {
      name: string;
      quantity?: string;
      categoryId?: string;
    }) => {
      if (!groceryList?.id) throw new Error('No list found');
      
      const payload = {
        name: item.name,
        quantity: item.quantity || null,
        categoryId: item.categoryId || null,
        listId: groceryList.id,
      };

      if (navigator.onLine) {
        const response = await fetch('/api/groceries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create item');
        }
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
      queryClient.invalidateQueries({ queryKey: ['grocery-list'] });
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
        const response = await fetch('/api/groceries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update item');
        }
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
      queryClient.invalidateQueries({ queryKey: ['grocery-list'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur lors de la modification', 'error');
    },
  });

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    addItemMutation.mutate({
      name: newItemName,
      quantity: newItemQuantity || undefined,
      categoryId: selectedCategory || undefined,
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Mode Course</h1>
            <p className="text-gray-500">Cochez les articles achetés</p>
          </div>
          <Button 
            onClick={() => setShowShoppingMode(false)} 
            variant="outline"
            startIcon={<MaterialIcon name="arrow_back" size={20} />}
          >
            Retour
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MaterialIcon name="shopping_bag" size={24} className="text-primary-600" />
                À acheter
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(shoppingItems).length === 0 ? (
                <div className="text-center py-12">
                  <MaterialIcon name="check_circle" size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Rien à acheter</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(shoppingItems).map(([category, categoryItems]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <MaterialIcon name="category" size={18} className="text-gray-400" />
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary-300 transition-all duration-200"
                          >
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: item.id,
                                  status: 'BOUGHT',
                                })
                              }
                              className="w-6 h-6 border-2 border-gray-300 rounded-lg flex-shrink-0 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 flex items-center justify-center group"
                            >
                              <MaterialIcon 
                                name="check" 
                                size={16} 
                                className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              {item.quantity && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {item.quantity}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {Object.keys(boughtItems).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MaterialIcon name="check_circle" size={24} className="text-green-600" />
                  Pris
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(boughtItems).map(([category, categoryItems]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <MaterialIcon name="category" size={18} className="text-gray-400" />
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200"
                          >
                            <MaterialIcon name="check_circle" size={24} className="text-green-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium line-through text-gray-600">
                                {item.name}
                              </p>
                              {item.quantity && (
                                <p className="text-sm text-gray-500 mt-0.5 line-through">
                                  {item.quantity}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: item.id,
                                  status: 'MUST_BUY',
                                })
                              }
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Nos courses</h1>
          <p className="text-gray-500">Gérez votre liste de courses</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowShoppingMode(true)}
            variant="outline"
            disabled={itemsByStatus.MUST_BUY.length === 0}
            startIcon={<MaterialIcon name="shopping_bag" size={20} />}
          >
            Mode Course
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            startIcon={<MaterialIcon name="add" size={20} />}
          >
            Ajouter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">À la maison</p>
                <p className="text-2xl font-bold text-gray-900">{itemsByStatus.HOME.length}</p>
              </div>
              <MaterialIcon name="home" size={32} className="text-primary-500" />
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">À acheter</p>
                <p className="text-2xl font-bold text-gray-900">{itemsByStatus.MUST_BUY.length}</p>
              </div>
              <MaterialIcon name="shopping_bag" size={32} className="text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
              <MaterialIcon name="inventory_2" size={32} className="text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items at home */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MaterialIcon name="home" size={24} className="text-primary-600" />
            À la maison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {itemsByStatus.HOME.length === 0 ? (
            <div className="text-center py-12">
              <MaterialIcon name="inventory_2" size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun article à la maison</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {itemsByStatus.HOME.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
                >
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: item.id,
                        status: 'MUST_BUY',
                      })
                    }
                    className="w-6 h-6 border-2 border-gray-300 rounded-lg flex-shrink-0 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 flex items-center justify-center group"
                  >
                    <MaterialIcon 
                      name="add_shopping_cart" 
                      size={16} 
                      className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.quantity && (
                        <span className="text-sm text-gray-500">{item.quantity}</span>
                      )}
                      {item.category && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {item.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>Ajouter un article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nom"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Ex: Lait"
                autoFocus
                startIcon={<MaterialIcon name="label" size={20} />}
              />
              <Input
                label="Quantité (optionnel)"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="Ex: 2L"
                startIcon={<MaterialIcon name="numbers" size={20} />}
              />
              <Select
                label="Catégorie (optionnel)"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                startIcon={<MaterialIcon name="category" size={20} />}
              >
                <option value="">Sans catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowAddModal(false);
                    setNewItemName('');
                    setNewItemQuantity('');
                    setSelectedCategory('');
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  fullWidth
                  onClick={handleAddItem} 
                  disabled={!newItemName.trim() || addItemMutation.isPending}
                  startIcon={<MaterialIcon name="add" size={20} />}
                >
                  {addItemMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
