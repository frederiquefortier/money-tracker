# Prompts de correction (13 et 14 février 2026)

Raw prompts, kept verbatim. They were written against the first prototype, so they name
files and hooks that do not exist in this repo (`AccountsList.tsx`, `useCategories`,
`users.interface_currency`). Treat them as detailed acceptance criteria for the matching
requirements, not as instructions about current code. Where the schema design in
[database.md](../../01_building/database.md) departs from a prompt, it says so.

---

## 13 février

### Correction 1 : Gestion des institutions bancaires
J'ai besoin de modifier la gestion des institutions bancaires dans l'application. Actuellement, les institutions sont simplement du texte libre. Voici les changements requis :

Modifications à apporter :
1. Créer une nouvelle table institutions dans Supabase :
    * id (uuid, PK)
    * user_id (uuid, FK)
    * name (text, NOT NULL)
    * website_url (text, nullable)
    * created_at (timestamp)
    * Ajouter RLS policy appropriée
2. Modifier la table accounts :
    * Remplacer la colonne institution (text) par institution_id (uuid, FK vers institutions)
    * Ajouter une relation foreign key
3. Créer un composant de gestion des institutions :
    * CRUD complet pour les institutions
    * Formulaire avec validation (nom requis, URL optionnelle avec validation format)
    * Liste des institutions existantes réutilisables
4. Modifier le formulaire de compte :
    * Remplacer l'input texte par un select/combobox d'institutions
    * Ajouter un bouton "Créer nouvelle institution" qui ouvre un dialog inline
    * Afficher le lien web de l'institution si disponible
5. Grouper les comptes par institution sur la page des comptes :
    * Affichage en sections avec header par institution
    * Nom de l'institution cliquable (ouvre le site web si lien disponible)
    * Possibilité de collapse/expand chaque groupe
    * Total du solde par institution

### Correction 2 : Tri des comptes
J'ai besoin d'ajouter des fonctionnalités de tri sur la liste des comptes.

Modifications à apporter :
1. Ajouter un composant de tri dans AccountsList.tsx :
    * Dropdown ou boutons de tri avec les options :
        * Par nom (alphabétique)
        * Par type (alphabétique)
        * Par devise (alphabétique)
        * Par solde (croissant) → du plus négatif au plus positif
        * Par solde (décroissant) → du plus positif au plus négatif
    * Icône indiquant le tri actif
2. Implémenter la logique de tri :
    * Le tri doit s'appliquer aux comptes au sein de chaque groupe d'institution
    * Sauvegarder la préférence de tri dans localStorage
    * Restaurer la préférence au chargement de la page
3. États visuels :
    * Indicateur visuel clair du tri actif
    * Animation smooth lors du changement de tri
    * Accessibilité : annoncer le changement de tri aux screen readers

### Correction 3 : Gestion personnalisable des devises avec validation API
J'ai besoin d'implémenter un système de devises où l'utilisateur gère sa propre liste de devises utilisables, avec validation via l'API HexaRate https://hexarate.paikama.co/.

Modifications à apporter :
1. Créer une table user_currencies dans Supabase :
    * id (uuid, PK)
    * user_id (uuid, FK)
    * currency_code (text, NOT NULL) - ex: "USD", "EUR"
    * currency_name (text, NOT NULL) - ex: "Dollar américain"
    * is_default (boolean, default false) - les 5 devises par défaut
    * display_order (integer) - pour tri personnalisé
    * created_at (timestamp)
    * Contrainte UNIQUE sur (user_id, currency_code)
    * RLS policy appropriée
2. Migration initiale :
    * Créer un trigger/fonction qui insère automatiquement les 5 devises par défaut pour chaque nouvel utilisateur :
        * CHF - Franc suisse
        * EUR - Euro
        * GBP - Livre sterling
        * USD - Dollar américain
        * CAD - Dollar canadien
    * Tri alphabétique par currency_code
    * Marquer is_default = true pour ces 5 devises
3. Créer une fonction de validation dans lib/hexarate.ts :
   `export async function validateCurrency(currencyCode: string): Promise<{ isValid: boolean currencyName?: string;error?: string }>`
    * Appeler l'API HexaRate pour vérifier que la devise est supportée
    * Récupérer le nom officiel de la devise depuis l'API
    * Gérer les erreurs réseau et codes invalides
    * Cache (360 jours) pour éviter validations répétées
4. Créer le composant de gestion des devises :
    * Page/Section "Mes devises" dans les paramètres
    * Liste des devises actives (tri alphabétique par code)
    * Badge "Par défaut" sur les 5 devises d'origine
    * Bouton "Ajouter une devise" ouvrant un dialog
5. Formulaire d'ajout de devise :
    * Input pour code devise (ex: "JPY") - 3 lettres, uppercase auto
    * Validation en temps réel via l'API HexaRate :
        * Debounce de 500ms
        * Loader pendant validation
        * Message de succès avec nom de devise si valide
        * Message d'erreur si devise non supportée ou déjà dans la liste
    * Auto-complétion suggérée (optionnel) : top 20 devises mondiales
    * Bouton "Ajouter" désactivé tant que validation échouée
6. CRUD des devises utilisateur :
    * Ajouter : validation API obligatoire avant insertion
    * Supprimer :
        * Vérifier qu'aucune transaction n'utilise cette devise avant suppression
        * Dialog de confirmation si transactions existantes : "X transactions utilisent cette devise. Voulez-vous vraiment la supprimer ?"
    * Réordonner : drag & drop pour tri personnalisé (optionnel)
7. Mise à jour des sélecteurs de devises :
    * Créer hooks/useUserCurrencies.ts :
        * Query TanStack pour fetch depuis user_currencies
        * Tri alphabétique par défaut
        * Cache avec invalidation appropriée
    * Remplacer tous les selects de devises pour utiliser ce hook
    * Affichage : "CODE - Nom" (ex: "USD - Dollar américain")
    * Les devises favorites (si fonctionnalité existante) apparaissent en premier
8. Gestion des erreurs de validation :
    * Si API HexaRate indisponible lors de l'ajout :
        * Message clair : "Impossible de valider la devise. Vérifiez votre connexion."
        * Bouton "Réessayer"
        * Ne pas bloquer l'utilisateur sur ses devises existantes
    * Toast d'erreur avec détails techniques en mode dev
9. UX améliorée :
    * Recherche/filtre dans les longs selects de devises
    * Affichage du symbole si disponible (€, $, £, etc.)
    * Empty state si l'utilisateur supprime toutes ses devises (avec CTA pour réinitialiser aux 5 par défaut)

Types TypeScript :
```ts
type UserCurrency = {
  id: string;
  currency_code: string;
  currency_name: string;
  is_default: boolean;
  display_order: number;
}
```

Considérations importantes :
* La validation API est obligatoire pour garantir la compatibilité avec HexaRate
* Le système doit rester fonctionnel même si l'API est temporairement indisponible (utiliser les devises déjà validées)
* Migration smooth pour les utilisateurs existants (leur ajouter les 5 devises par défaut)

### Correction 4 : Changement global de la devise d'interface
J'ai besoin d'ajouter un sélecteur de devise d'interface accessible globalement depuis n'importe quelle page.

Modifications à apporter :
1. Ajouter le sélecteur dans le layout principal :
    * Créer un composant CurrencyToggle.tsx dans le header/navbar
    * Style similaire à un language switcher
    * Position : à côté du menu utilisateur ou dans la toolbar
    * Dropdown compact affichant le code de la devise active (ex: "USD", "EUR")
2. Comportement du dropdown :
    * Liste scrollable des devises avec recherche
    * Afficher les favoris en premier (si fonctionnalité existante)
    * Highlight sur la devise actuellement sélectionnée
    * Fermeture automatique après sélection
3. Synchronisation avec Supabase :
    * Mettre à jour users.interface_currency immédiatement
    * Optimistic update pour feedback instantané
    * Toast de confirmation (optionnel, peut être trop intrusif)
4. Réactivité de l'application :
    * Tous les montants affichés doivent se mettre à jour automatiquement
    * Utiliser un context ou state global (Zustand ou Context API)
    * Invalider les queries TanStack Query concernées si nécessaire
    * Afficher un spinner subtil pendant conversion si beaucoup de données
5. Persistance et performance :
    * Cache des taux de change pour la nouvelle devise
    * Éviter les re-renders inutiles
    * Debounce si l'utilisateur change rapidement

Considérations UX :
* Le toggle doit être visible mais pas intrusif
* Responsive : peut devenir un bouton pleine largeur sur mobile
* Accessibilité : keyboard navigation, ARIA labels
* Indiquer visuellement quand une conversion est en cours

## 14 février

### Correction 5 : Transferts entre comptes avec frais
J'ai besoin d'ajouter la fonctionnalité de transfert entre comptes dans l'application.

Modifications à apporter :
1. Modifier la table transactions dans Supabase :
    * Ajouter le type transfer dans l'enum type (actuellement: expense, income, adjustment)
    * Ajouter la colonne transfer_to_account_id (uuid, FK vers accounts, nullable)
    * Ajouter la colonne transfer_fee (decimal, nullable)
    * Ajouter la colonne linked_transfer_id (uuid, FK vers transactions, nullable) pour lier les 2 transactions
2. Logique de création de transfert :
    * Un transfert crée 2 transactions liées :
        * Transaction 1 : retrait du compte source (type transfer, montant négatif)
        * Transaction 2 : dépôt sur le compte destination (type transfer, montant positif)
        * Les deux ont leur linked_transfer_id pointant l'une vers l'autre
    * Si des frais sont spécifiés :
        * Créer une 3ème transaction de type expense pour les frais
        * Catégorie : créer automatiquement "Frais bancaires" si n'existe pas
        * Lier visuellement aux transactions de transfert
3. Créer le formulaire de transfert :
    * Sélection compte source (avec solde affiché)
    * Sélection compte destination (exclure le compte source)
    * Montant du transfert
    * Devise (héritée du compte source par défaut, modifiable)
    * Frais optionnels (champ séparé)
    * Date du transfert
    * Notes optionnelles
4. Affichage dans la liste des transactions :
    * Icône spécifique pour les transferts (ex: arrows-left-right)
    * Format : "Transfert: Compte A → Compte B"
    * Afficher le montant avec signe approprié selon le contexte
    * Grouper visuellement les transactions liées (badge ou indentation)
    * Les frais apparaissent comme transaction séparée mais liée
5. Calcul des soldes :
    * Les transferts doivent correctement impacter les soldes des deux comptes
    * Les frais réduisent le solde du compte source
6. Suppression et modification :
    * Supprimer un transfert supprime les 2 transactions liées + frais
    * Modifier un transfert met à jour les 2 transactions
    * Confirmation explicite avant suppression

### Correction 6 : Devise obligatoire pour les transactions
J'ai besoin de rendre la sélection de devise obligatoire lors de la création/modification d'une transaction.

Modifications à apporter :
1. Modifier le formulaire de transaction :
    * Rendre le champ devise requis (validation Zod dans TOUS les formulaires)
    * Pré-remplir avec la devise du compte sélectionné par défaut
    * Si pas de compte sélectionné, pré-remplir avec default_currency de l'utilisateur
    * Message d'erreur clair si l'utilisateur tente de soumettre sans devise
2. Validation côté serveur :
    * Ajouter contrainte NOT NULL sur les colonnes de devise dans la table transactions
    * Trigger Supabase pour valider la présence de devise
3. Migration de données existantes :
    * Script de migration pour les transactions sans devise :
        * Utiliser la devise du compte associé
        * Fallback sur devise par défaut de l'utilisateur
        * Fallback ultime sur CAD
4. UX améliorée :
    * Afficher clairement la devise sélectionnée dans le formulaire
    * Highlight visuel du champ devise côte à côte du montant

### Correction 7 : Catégories favorites mises en avant
J'ai besoin de mettre en avant les catégories favorites dans le sélecteur de catégories.

Modifications à apporter :
1. Modifier le composant de sélection de catégorie :
    * Créer deux groupes distincts dans le dropdown :
        * Groupe "Favoris" en haut
        * Groupe "Toutes les catégories" en dessous
    * Séparateur visuel clair entre les deux groupes
    * Style différencié pour les favoris (icône étoile, couleur accent)
2. Logique de tri :
    * Dans "Favoris" : tri alphabétique ou par fréquence d'utilisation
    * Dans "Toutes" : respecter la hiérarchie parent/enfant avec indentation
    * Ne pas dupliquer : si catégorie est favorite, elle n'apparaît QUE dans favoris
3. Fonctionnalité rapide :
    * Bouton étoile à côté de chaque catégorie pour toggle favori directement dans le dropdown
    * Optimistic update
    * Animation smooth quand catégorie déplacée vers/depuis favoris
4. Gestion hiérarchie :
    * Si sous-catégorie est favorite, afficher "Parent > Enfant" dans les favoris
    * Indentation maintenue dans "Toutes les catégories"
5. Recherche dans le select :
    * La recherche doit fonctionner sur les deux groupes
    * Highlight des résultats dans les deux sections

### Correction 8 : Exclusion des catégories archivées
J'ai besoin d'exclure les catégories archivées de tous les sélecteurs de catégories.

Modifications à apporter :
1. Modifier useCategories hook :
    * Ajouter un paramètre includeArchived: boolean = false
    * Par défaut, filtrer les catégories archivées à la date actuelle
    * Logique : une catégorie est archivée si son dernier événement dans category_archive_history est "archived" et effective_date <= today
2. Mise à jour des sélecteurs :
    * Tous les dropdowns de sélection de catégorie doivent utiliser useCategories({ includeArchived: false })
    * Seule exception : page de gestion des catégories où on affiche tout
3. Cas spécial : modification de transaction existante :
    * Si une transaction a une catégorie maintenant archivée :
        * L'afficher dans le formulaire d'édition (en lecture seule ou avec badge "Archivée")
        * Permettre de la changer vers une catégorie active
        * Ne pas la proposer pour les nouvelles transactions
4. Message utilisateur :
    * Si aucune catégorie active n'existe, afficher message clair :
        * "Aucune catégorie disponible. Créez-en une ou réactivez une catégorie archivée."
        * Bouton CTA vers gestion des catégories

### Correction 9 : Affichage des catégories archivées
J'ai besoin de séparer visuellement les catégories archivées des catégories actives dans la page de gestion des catégories.

Modifications à apporter :
1. Restructurer la page des catégories :
    * Deux sections distinctes avec headers :
        * "Catégories actives" (en haut, section principale)
        * "Catégories archivées" (en bas, section collapsible)
    * Section archivées collapsed par défaut
    * Badge avec le nombre de catégories archivées dans le header
2. Styles visuels :
    * Catégories actives : couleurs normales, pleine opacité
    * Catégories archivées :
        * Opacité réduite (60%)
        * Icône d'archive à côté du nom
        * Badge "Archivée depuis [date]"
3. Actions disponibles :
    * Sur catégories actives : Modifier, Archiver, Supprimer, Toggle favori
    * Sur catégories archivées : Réactiver, Voir historique, Supprimer définitivement
4. Filtres :
    * Ajouter toggle "Afficher les archivées" dans la barre de filtres
    * Sauvegarde de la préférence dans localStorage
5. Recherche :
    * Par défaut : chercher uniquement dans les actives
    * Si toggle activé : chercher dans les deux

### Correction 10 : Affichage de l'historique des catégories
J'ai besoin de corriger l'affichage de l'historique d'archivage/réactivation des catégories qui est actuellement invisible.

Modifications à apporter :
1. Créer le composant d'affichage de l'historique :
    * Dialog/Modal "Historique de [Nom catégorie]"
    * Timeline verticale avec toutes les entrées de category_archive_history
    * Chaque entrée affiche :
        * Type d'action (Archivée / Réactivée)
        * Date effective
        * Date de l'action (created_at)
        * Icône appropriée (archive-box / arrow-path)
2. Requête Supabase :
    * Créer useCategoryHistory(categoryId) hook
    * Query : SELECT * FROM category_archive_history WHERE category_id = $1 ORDER BY effective_date DESC
3. Affichage visuel :
    * Timeline avec ligne verticale connectant les événements
    * Alternance de couleurs : archivage (orange/rouge), réactivation (vert)
    * Format de date lisible : "15 janvier 2024"
    * Si aucun historique : message "Cette catégorie n'a jamais été archivée"
4. Accès au popup :
    * Bouton "Voir historique" sur chaque carte de catégorie
    * Icône horloge ou calendar avec tooltip
    * Raccourci clavier si pertinent
5. État vide :
    * Message encourageant si historique vide
    * Explication de ce que fait l'archivage

### Correction 11 : Picker d'emojis pour icônes de catégories
J'ai besoin d'améliorer le sélecteur d'icônes de catégories en utilisant un emoji picker complet. https://github.com/ealush/emoji-picker-react

Modifications à apporter :
1. Installer la dépendance :
   `npm install emoji-picker-react`
2. Créer le composant EmojiPicker :
    * Wrapper autour de emoji-picker-react
    * Configuration :
        * Theme : GOOGLE (comme spécifié)
        * Recherche activée
        * Catégories : toutes disponibles
        * Skintonepicker : désactivé (optionnel)
    * Props : onEmojiSelect, defaultEmoji
3. Intégrer dans le formulaire de catégorie :
    * Remplacer le sélecteur actuel par un bouton déclencheur
    * Afficher l'emoji sélectionné dans le bouton
    * Popover/Dialog pour le picker (Shadcn Popover recommandé)
    * Preview de l'emoji en grand à côté du nom de catégorie
4. Génération automatique d'icône :
    * Conserver la logique de génération auto basée sur le nom
    * Utiliser un mapping intelligent nom → emoji suggéré
    * Exemples :
        * "Alimentation" → 🍕
        * "Transport" → 🚗
        * "Loisirs" → 🎮
        * "Santé" → 🏥
    * Toujours permettre l'override manuel
5. Stockage :
    * Stocker l'emoji comme string unicode dans categories.icon
    * Validation : s'assurer que c'est bien un emoji valide
6. UX :
    * Recherche rapide dans le picker
    * Emojis récemment utilisés en haut
    * Fermeture auto après sélection
    * Bouton "Réinitialiser" pour revenir à l'emoji auto-généré

Considérations techniques :
* Lazy load du picker (code splitting)
* Gestion du z-index du popover
* Responsive : plein écran sur mobile
* Accessibilité : navigation clavier dans le picker
