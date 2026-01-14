# Configuration PostgreSQL pour accès distant

## ✅ Utilisateur créé

- **Nom d'utilisateur**: `gestion_vie`
- **Mot de passe**: `gestionmatvie`
- **Base de données**: `gestionnaire_vie`

## 📝 Configuration effectuée

1. ✅ Utilisateur PostgreSQL créé avec mot de passe
2. ✅ Base de données créée
3. ✅ Permissions accordées
4. ✅ pg_hba.conf configuré pour connexions distantes

## ⚙️ Configuration restante (pour connexions distantes)

Pour permettre les connexions depuis un autre PC, vous devez modifier `postgresql.conf` :

```bash
# Éditer le fichier de configuration
sudo nano /opt/homebrew/var/postgresql@14/postgresql.conf

# Trouver la ligne et modifier :
#listen_addresses = 'localhost'
# En :
listen_addresses = '*'

# Redémarrer PostgreSQL
brew services restart postgresql@14
```

## 🔗 URL de connexion

### Depuis ce PC (localhost)
```
postgresql://gestion_vie:gestionmatvie@localhost:5432/gestionnaire_vie?schema=public
```

### Depuis un autre PC (remplacez IP_ADDRESS par l'IP de ce Mac)
```
postgresql://gestion_vie:gestionmatvie@IP_ADDRESS:5432/gestionnaire_vie?schema=public
```

**IP de ce Mac** : `192.168.1.99`

Pour trouver l'IP de ce Mac :
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 🔒 Sécurité

⚠️ **Important** : Les connexions distantes sont maintenant activées. Assurez-vous que :
- Votre pare-feu est configuré correctement
- Vous limitez l'accès au réseau local si possible

## 🧪 Test de connexion

Pour tester depuis un autre PC :
```bash
psql -h IP_ADDRESS -U gestion_vie -d gestionnaire_vie
# Entrez le mot de passe : gestionmatvie
```
