# APP (v1, notes d'origine)

Raw notes, kept verbatim. The organized, deduplicated version is
[requirements.md](../requirements.md). Where this file and the V.AI notes disagree, the
requirements file says which one won.

---

## Configuration
Un nouvel utilisateur est guidé au travers des pages pour configurer sa devise et ses catégories.

## Comptes
Un utilisateur peut configurer ses comptes bancaires.

Un compte bancaire peut avoir un nom, un type et un établissement.

Un compte bancaire peut être fermé.

Un compte bancaire peut être masqué pour les futurs transactions.

Lors de la création d'un compte, un montant de base est ajouté.

## Transactions
Un utilisateur peut ajouter une dépense.

Un utilisateur peut ajouter un revenue.

Un utilisateur peut associé un revenue à une dépense comme remboursement.

Une transaction peut-être associé à un magasin.

Un utilisateur peut réajuster le montant dans un compte.

Un utilisateur peut ajouter une transaction récurrente et la modifier en conservant un historique de l'ancien montant et du jour de la modification. Il peut aussi arrêter la récurrence.

Une dépense peut être associé à un proche; soit:
- Il a été invité
- Il doit remboursé la dépense

Il peut indiquer le montant associé au proche soit en valeur, part ou pourcentage.

Plus généralement, sans la notion de proche:
- Un utilisateur peut cocher qu'il a invité quelqu'un et entrer le montant avec le nombre de personnes.
- Un utilisateur peut cocher qu'il attends un remboursement et entrer le montant.

## Magasins
Un magasin peut avoir une catégorie prédéfinie.

Un magasin peut avoir des alias -dans le but d'un import de csv bancaire

Un magasin peut être associé avec un pays de provenance.

## Devises
Une devise de base peut être défini pour une plage de dates données.

Un utilisateur peut voir l'historique de sa devise de base.

Une transaction peut être fait dans une devise au choix.

Des devises peuvent être ajoutés aux favoris.

Une transaction dans une devise autre que celle de base est converti dans la devise de base avec le taux de change en vigueur au moment de la dépense.

Une transaction autre que dans la devise de base a 2 champs modifiables : prix originel et prix payé (si par carte) avec un champ readonly frais de transaction.

## Catégories
Un utilisateur peut ajouter une catégorie.

Un utilisateur peut ajouter une sous-catégorie. Aucun niveau limite.

Un utilisateur peut archiver une catégorie à partir d'une date au choix.

Un utilisateur peut réactiver une catégorie à partir d'une date au choix.

Un utilisateur peut voir l'historique d'activation d'une catégorie.

Un utilisateur peut séparer une transaction sur plusieurs catégories, soit par montant, part ou pourcentage.

Un utilisateur peut mettre une catégorie en favori.

Une catégorie peut être de type investissement.

Une catégorie peut être de type revenu.

Une catégorie peut avoir une icône. Une icône est choisi par défaut pas l'app selon son nom.

## Tags
Un utilisateur peut regrouper plusieurs transactions de diverses catégories sous un même tag.

## Dashboard
Un utilisateur peut sélectionner une plage de dates pour visualiser les données. Soit par année, 12 dernier mois, 6 dernier mois ou personnalisé.

Une catégorie archivé n'apparait pas dans les graphiques si la plage de date sélectionné ne l'inclus pas.

Une dépense en attente d'un remboursement est mise en valeur.

Une dépense avec un remboursement affiche le montant en additionnant le revenue à la dépense.

Pour un magasin donné, on peut voir l'évolution de sa facture en pourcentage.

Chaque catégorie affiche le nombre total de transactions effectués pour la période donnée, avec le montant total, moyen et médian.

Chaque catégorie affiche l'évolution des transaction en pourcentage.

Les transactions sont représentés sous forme de graphique.

Un utilisateur peut filtrer les données par date, catégorie, sous-catégorie et tags.

Un utilisateur peut visualiser ses donnés sous forme de liste ou de graphique.

## Proches
Une transaction peut être associé à un proche.

Une transaction peut être associé à un groupe de proches.

Un utilisateur peut configurer ses proches.

Un utilisateur peut regrouper ses proches.

Un utilisateur peut ajouter une icône personnalisé à chaque proche.

## Évènements
Un utilisateur peut créer un évènement qui contient un nom, une date, un type et des proches associés.

Une transaction peut être associé à un événement.

Un utilisateur peut consulter une vue calendrier qui affichent les événements avec le prix total associé.

## Network
Un utilisateur peut entré ses dettes.

Un utilisateur peut entré la valeur de ses différents comptes d'investissements.

Un utilisateur peut entré le type de compte d'investissement et le lieu où il se situe.

Un utilisateur peut entré l'argent qu'il a ajouté à ses comptes d'investissement et voir son profit en montant et pourcentage.

Un utilisateur peut visualiser un graphique de l'évolution de son network sur une plage de date au choix.

Un utilisateur peut voir en pourcentage l'évolution de son network -total, investissements, dettes- sur une plage de date au choix. Par défaut: du début de son compte à aujourd'hui.

Un utilisateur peut masqué les mois sans donné dans le graphique.

Un utilisateur peut prévisualiser le futur avec le montant actuel selon le x% de croissance différent.

Un utilisateur peut prévisualiser le futur avec ses données customs.

Un utilisateur peut voir le nombre d'argent qu'il a placé et constater le profit réalisé en montant et pourcentage.

Je veux atteindre x$ dans les x prochaines années. Combien dois-je investir chaque année si mon retour est x%/le même qu'actuellement.

Si ça continue comme ça, dans x année j'aurais x$.

## Budget
Un utilisateur peut configurer un montant à ne pas dépasser ou à atteindre pour chaque catégorie selon une plage de dates au choix.

Un utilisateur peut configurer un nombre de transactions à ne pas dépasser ou à atteindre pour chaque catégorie selon une plage de dates au choix.

Un utilisateur peut masquer une catégorie pour le calcul du fond d'urgence.

Un utilisateur peut indiquer son revenu mensuel attendu.

Un utilisateur peut indiquer pour combien de mois il souhaite avoir un fond d'urgences.

Un utilisateur peut indiquer le compte dans lequel son fond d'urgences se situe.

Un utilisateur peut voir s'il est en voie d'avoir son fond d'urgence. S'il a plus dans son compte, lui indiquer pour combien de mois.

Un utilisateur peut masqué les tooltips du budget.

## Yearly Review

## Canada
Un utilisateur peut entré sa date de naissance.

On fait des recommandations de compte d'investissement à l'utilisateur selon son âge.

Un utilisateur peut indiquer le pays d'un magasin.

À la fin de l'année, on affiche à l'utilisateur à combien de % il a fait des achats locaux.

## MISC.

Toggle monétaire/sociale
Vue timeline au scroll et vue calendrier
Tag + expensive, less expensive
Stat qui a été plus vue
Stat avec qui a moins dépenser
Notifications doit rebourser na pas fembourser
Vue annee vue mpis
Date et heure

---

Séparé par emploi, puis sous par année et un total.

Projections
Comme suisse

Csv importer visual
