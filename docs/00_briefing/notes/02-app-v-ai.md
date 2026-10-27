# APP - V.AI (notes révisées)

Raw notes, kept verbatim. This is the most recent full pass over the feature list and the
baseline for [requirements.md](../requirements.md).

---

## Comptes
Un utilisateur peut configurer ses comptes bancaires.

Un compte bancaire peut avoir un nom, un type et un établissement.

Lors de la création d'un compte, un montant de base est ajouté.

Un compte bancaire peut être fermé.

## Transactions
Un utilisateur peut ajouter une dépense.

Un utilisateur peut ajouter un revenue.

Un utilisateur peut associé un revenue à une dépense comme remboursement.

Une transaction peut être associé à un magasin.

Un utilisateur peut ré-ajuster le montant dans un compte.

Un utilisateur peut ajouter une transaction récurrente et la modifier en conservant un historique de l'ancien montant et du jour de la modification. Il peut aussi arrêter la récurrence.

Une dépense peut être associé à un proche ou des proches; soit:
- Il a été invité
- Il doit remboursé la dépense

Il peut indiquer le montant associé au proche soit en valeur, part ou pourcentage.

## Magasins
Un magasin peut avoir une catégorie prédéfinie.

Un magasin peut avoir des alias.

## Devises
Un utilisateur peut modifier la devise de l'interface. Tous les montants s'affichent dans cette devise. Un montant dans une autre devise est converti et le taux de change utilisé est celui en vigueur à la date de la transaction ou celle d'aujourd'hui s'il n'y a pas de date spécifique lié au montant.

Une transaction peut être fait dans une devise au choix.

Une devise par défaut peut être défini.

Des devises peuvent être ajoutés aux favoris.

Une transaction a 2 champs modifiables : prix originel dans une devise et prix payé dans une autre devise avec un champ readonly frais de transaction qui est calculé par la différence entre le taux de change en vigueur de ces 2 devises.

Les devises par défaut sont classés en ordre alphabétique. Il s'agit de :
- Dollar américain
- Dollar canadien
- Euro
- Franc suisse
- Livre sterling

Un utilisateur peut ajouté plus de devises à cette liste. À chaque ajout de devise, on valide qu'on peut la traiter avec https://hexarate.paikama.co/.

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

Une catégorie peut avoir une icône.  Une icône est choisi par défaut par l'app selon son nom.

## Tags
Un utilisateur peut créer des tags.

Un tag peut être associé à une plage de dates et à des catégories. Pour la durée de cette plage, il s'ajoute automatiquement à toutes les transactions qui font partie d'au moins une de ses catégories.

Une transaction peut avoir un ou plusieurs tags.

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

Un proche a un nom.

Un proche ou un groupe de proches peut être archivé et masqué.

## Évènements
Un utilisateur peut créer des types d'événement.

Un utilisateur peut créer un évènement qui contient un nom, une date, un type et des proches associés. Les proches associés sont facultatifs.

Une transaction peut être associé à un événement.

Un utilisateur peut consulter une vue calendrier qui affichent les événements avec le prix total associé.

Un utilisateur peut comparer divers événements d'un même type.

Un utilisateur peut budgeter un événement et suivre le résultat en temps réel.

## Patrimoine
Un utilisateur peut entré ses dettes.

Un utilisateur peut entré la valeur de ses différents comptes d'investissements.

Un utilisateur peut entré le type de compte d'investissement et le lieu où il se situe.

Un utilisateur peut entré l'argent qu'il a ajouté à ses comptes d'investissement et voir son profit en montant et pourcentage.

Un utilisateur peut visualiser un graphique de l'évolution de son networth sur une plage de date au choix.

Un utilisateur peut voir en pourcentage l'évolution de son networth -total, investissements, dettes- sur une plage de date au choix. Par défaut: du début de son compte à aujourd'hui.

Un utilisateur peut masqué les mois sans données dans le graphique.

Un utilisateur peut voir le nombre d'argent qu'il a placé et constater le profit réalisé en montant et pourcentage.

Un utilisateur peut prévisualiser le futur avec le montant actuel selon le x% de croissance différent. (5%, 7%, 10%)

Un utilisateur peut prévisualiser le futur avec ses données customs.

- Je veux atteindre x$ dans les x prochaines années. Combien dois-je investir chaque année si mon retour est x%/le même qu'actuellement.
- Si ça continue comme ça, dans x année j'aurais x$.

## Budget
Un utilisateur peut configurer un montant à ne pas dépasser ou à atteindre pour chaque catégorie selon une plage de dates au choix.

Un utilisateur peut configurer un nombre de transactions à ne pas dépasser ou à atteindre pour chaque catégorie selon une plage de dates au choix.

Un utilisateur peut masquer une catégorie pour le calcul du fond d'urgence.

Un utilisateur peut indiquer son revenu mensuel attendu.

Un utilisateur peut indiquer pour combien de mois il souhaite avoir un fond d'urgences.

Un utilisateur peut indiquer le compte dans lequel son fond d'urgences se situe.

Un utilisateur peut voir s'il est en voie d'avoir son fond d'urgence. S'il a plus dans son compte, lui indiquer pour combien de mois.

Un utilisateur qui atteint ses objectifs d'épargne et d'investissement reçoit une animation qui le félicite.

Un utilisateur peut masqué les tooltips du budget.

## Yearly Review
Un utilisateur peut alterné entre une vue monétaire et une vue sociale.

Visuellement, on voit une ligne du temps avec les mois sticky à gauche et à droite on trouve un calendrier qui défile selon le mois.

Un utilisateur peut voir le top 3 des jours les plus dépensiers.

Un utilisateur peut voir avec qui il a le plus dépensé.

Un utilisateur peut voir avec qui il a le moins dépensé.

Un utilisateur peut voir avec qui il a passé le plus d'événement.

Un utilisateur peut voir à qui il doit de l'argent et qui lui doit de l'argent d'un clin d'oeil.

Un utilisateur peut exporter son year in review sous plusieurs formats de charte.
