# NEURAPOLIS — Catalogue des 32 Événements Émergents Interactifs

**Anthologie des situations imprévisibles, loufoques et profondes de Val-Ferrand (Axe 2 & R3)**  
*Conforme aux spécifications de `PROJECT.md`, `ORIGINAL_REQUEST.md` et `survey_mechanics_art.md` §4*

---

## 1. Principes Directeurs du Moteur d’Événements Interactifs

Les événements émergents de NEURAPOLIS ne sont pas des fenêtres pop-up de texte passif :
1. **Ancrage déterministe** : Chaque événement est rattaché à une condition objective de l'état du monde (`WorldState`).
2. **Choix à doctrines contrastées** : Chaque situation propose deux à trois options incarnant des visions économiques différentes (Marché, Communs, Autorité, Solidarité).
3. **Réversibilité et causalité explicite** : Chaque conséquence porte une explication causale (`CauseFactor`) traçable dans le journal des causes (`causes: [{ facteur, poids }]`).
4. **Résonance des voix spectrales** : Les fantômes réagissent en direct aux choix du joueur, saluant la cohérence ou raillant les paradoxes de ses arbitrages.

---

## 2. Table Récapitulative des 32 Événements

| # | ID | Catégorie | Titre | Déclencheur clé |
|---|---|---|---|---|
| 1 | `EVT_CANARDS_CANAL` | Faune & Canal | L'Invasion Pacifique mais Encombrante des Canards | `vitaliteEpicerie >= 40` |
| 2 | `EVT_PIGEON_KLEPTOMANE` | Faune & Canal | Le Pigeon Pickpocket de Bonbons | `time.tick >= 288` (J2) |
| 3 | `EVT_BRUME_PHILOSOPHIQUE` | Faune & Canal | La Brume Fluviale des Pêcheurs | Météo non pluvieuse |
| 4 | `EVT_RELIQUE_SOVIETIQUE` | Faune & Canal | La Pêche à l’Aimant Miraculeuse | Friche visitée |
| 5 | `EVT_CHAT_SYNDICALISTE` | Faune & Canal | Le Chat Perché sur la Cloche du Collège | Matin d'école |
| 6 | `EVT_PANNE_GEANTE_BANQUET` | Glitch Urbain | La Panne d’Électricité & le Banquet aux Chandelles | Soirée J3+ |
| 7 | `EVT_TRESOR_CANALISATIONS` | Glitch Urbain | La Rumeur Folle du Trésor des Roses | Amitié Noah |
| 8 | `EVT_FONTAINE_MOUSSE` | Glitch Urbain | La Fontaine aux Mille Bulles | Météo soleil |
| 9 | `EVT_HORLOGE_13H` | Glitch Urbain | L’Heure Treize de Val-Ferrand | Midi passé |
| 10 | `EVT_HAMMAM_DE_RUE` | Glitch Urbain | Le Geyser d’Eau Chaude Urbain | Temps frais / nuageux |
| 11 | `EVT_LAMPADAIRE_MORSE` | Glitch Urbain | Le Lampadaire Mélancolique | Nuit à la friche |
| 12 | `EVT_DRONES_LANCE_PIERRES` | Guerre Commerciale | L’Interception des Drones du Drive | Part de marché Drive >= 30% |
| 13 | `EVT_COUPONS_PIRATES` | Guerre Commerciale | Les Bons de Réduction Impossibles | Vitalité épicerie <= 60 |
| 14 | `EVT_CLIENT_MYSTERE_ROBOT` | Guerre Commerciale | L’Inspecteur en Plastique | Trésorerie >= 15€ |
| 15 | `EVT_CAMION_BLOQUE` | Guerre Commerciale | L’Échouage du Semi-Remorque | Venelle des Roses |
| 16 | `EVT_SODA_FLUO` | Guerre Commerciale | L’Offensive des Canettes Chimiques Gratuites | Sortie du collège 16h |
| 17 | `EVT_TOURNOI_ECHECS_NAVETS` | Rivalités Locales | Le Tournoi d’Échecs sur Caisses Maraîchères | Place du marché |
| 18 | `EVT_TISANE_DE_VERITE` | Rivalités Locales | La Tisane Légendaire de Mme Bertin | Visite à l'épicerie |
| 19 | `EVT_DUEL_VIS_BOULONS` | Rivalités Locales | Le Grand Schisme Métrique de Samir et Karim | Établi de la friche |
| 20 | `EVT_FRESQUE_PREMONITOIRE` | Rivalités Locales | L’Artiste des Murs et l’Oracle Urbain | Nuit J2+ |
| 21 | `EVT_COURGE_DES_HAUTS` | Rivalités Locales | La Compétition de la Courge Géante | Balcons des Hauts |
| 22 | `EVT_TAYLOR_PAUSE_CAFE` | Joutes Fantômes | Taylor Chronomètre la Pause Café de Bertin | Épicerie active |
| 23 | `EVT_MARX_PAIN_CHOCOLAT` | Joutes Fantômes | Marx s’Indigne du Prix de la Viennoiserie | Heure du goûter |
| 24 | `EVT_OSTROM_MULTIPRISE` | Joutes Fantômes | La Tragédie de la Multiprise du Marché | Jour de marché |
| 25 | `EVT_SMITH_BOUSCULADE_BUS` | Joutes Fantômes | La Main Invisible du Bus Scolaire | Arrêt de bus 17h |
| 26 | `EVT_KEYNES_TROUS_PARC` | Joutes Fantômes | Keynes Veut Creuser des Trous dans le Parc | Mercredi après-midi |
| 27 | `EVT_BOULON_ROSE` | Économie Émergente | La Monnaie Clandestine du Quartier | Manque de monnaie J2+ |
| 28 | `EVT_TRIPORTEUR_VOILE` | Économie Émergente | Le Bolide Éolien de Noah | Pente des Hauts |
| 29 | `EVT_RADIO_METEO_POETIQUE` | Économie Émergente | Le Bulletin Météo Clandestin | Fréquence pirate 107.4 |
| 30 | `EVT_BOURSE_STICKERS_PUCES` | Économie Émergente | La Bourse Informelle de la Récréation | Préau du collège |
| 31 | `EVT_TROC_CONFITURE_GRILLE_PAIN` | Économie Émergente | Le Grand Troc du Dimanche Matin | Atelier de réparation |
| 32 | `EVT_BANQUET_DES_HERBES_FOLLES` | Économie Émergente | Le Festin Botanique des Friches | Talus ferroviaire |

---

## 3. Détail des Événements par Catégorie

### Catégorie A : Faune, Canal & Mystères Portuaires

#### 1. `EVT_CANARDS_CANAL` — L’Invasion Pacifique mais Encombrante des Canards
- **Contexte** : Une cinquantaine de canards colverts du canal ont envahi la place du marché, caquetant entre les étals.
- **Option 1 (Smith)** : Vendre des sachets de graines aux chalands (+8€ trésorerie, +3 réputation, +4 vitalité épicerie).
- **Option 2 (Ostrom)** : Guider le troupeau vers le bassin du parc avec les enfants (+5 confiance quartier, +4 réputation, coût 10 fatigue).
- **Option 3 (Taylor)** : Délimiter un périmètre avec des cageots et chronométrer l'évacuation (-2 réputation).

#### 2. `EVT_PIGEON_KLEPTOMANE` — Le Pigeon Pickpocket de Bonbons
- **Contexte** : Un pigeon borgne vole méthodiquement les bonbons à la violette de l’épicerie Bertin.
- **Option 1** : Piège doux en carton et mie de pain (+5 réputation, +3 confiance).
- **Option 2** : Racheter le bocal pour soulager Mme Bertin (-3€, +4 vitalité épicerie, +6 réputation).
- **Option 3** : Adopter le pigeon comme mascotte officielle du Stand (+4 réputation, rires du quartier).

#### 3. `EVT_BRUME_PHILOSOPHIQUE` — La Brume Fluviale des Pêcheurs
- **Contexte** : Une brume d'argent monte du bief ; les pêcheurs rangent leurs lignes et parlent de la valeur du temps.
- **Option 1** : Écouter leurs réflexions (+4 confiance, +3 réputation).
- **Option 2** : Leur servir du thé fumant de Bertin (-2€, +3 vitalité épicerie, +6 confiance).
- **Option 3** : Leur vendre des plombs de pêche façonnés à la friche (+5€).

#### 4. `EVT_RELIQUE_SOVIETIQUE` — La Pêche à l’Aimant Miraculeuse
- **Contexte** : Repêchage d'un carter d'embrayage de tracteur en fonte des années 1960 au fond du canal.
- **Option 1 (Marx)** : L’exposer comme totem ouvrier à la friche (+5 confiance, +4 réputation).
- **Option 2** : L’usiner au tour pour en faire des roulements de triporteur (+3 réputation, pièces logistiques).
- **Option 3** : Le revendre 15€ à un brocanteur vintage (+15€, -2 réputation).

#### 5. `EVT_CHAT_SYNDICALISTE` — Le Chat Perché sur la Cloche du Collège
- **Contexte** : Moustache dort sur le battant de la cloche, empêchant la sonnerie de rentrée.
- **Option 1** : Proclamer la grève féline et débattre dans la cour (+4 confiance, +3 réputation).
- **Option 2** : Escalader avec une sardine pour le descendre doucement (-1€, +4 réputation, +2 vitalité).
- **Option 3 (Taylor)** : Donner un coup de sifflet strident (-3 réputation, panique animale).

---

### Catégorie B : Pannes, Glitches Urbains & Rumeurs Locales

#### 6. `EVT_PANNE_GEANTE_BANQUET` — La Panne d’Électricité & le Banquet aux Chandelles
- **Contexte** : Coupure générale de courant à 19h dans tout le quartier des Roses.
- **Option 1** : Organiser un banquet géant aux chandelles avec les invendus (+8 vitalité, +15 confiance, +10 réputation).
- **Option 2** : Veillée acoustique d’accordéon et guitares (+10 confiance, +6 réputation).
- **Option 3 (Hobbes)** : Patrouilles avec lampes torches contre d'imaginaires pillages (+2 réputation).

#### 7. `EVT_TRESOR_CANALISATIONS` — La Rumeur Folle du Trésor des Roses
- **Contexte** : Un vieux plan de 1954 mentionne une cassette d'or sous la chaufferie de la cité.
- **Option 1** : Expédition nocturne avec Noah (découverte de bocaux de cerises de 1978, +4 confiance, +5 réputation).
- **Option 2** : Analyse critique d'archives avec Lina (découverte d'un schéma d'eaux pluviales, +3 réputation).
- **Option 3** : Vendre des kits de chercheurs de trésor aux collégiens (+8€, -4 réputation).

#### 8. `EVT_FONTAINE_MOUSSE` — La Fontaine aux Mille Bulles
- **Contexte** : Du savon noir déversé dans la fontaine transforme la place en bain moussant géant.
- **Option 1** : Bataille géante de bulles avec les passants (+6 confiance, +5 réputation).
- **Option 2** : Aider les cantonniers à rincer le bassin (+5 confiance, +6 réputation).
- **Option 3** : Lavage improvisé de vélos et triporteurs (+6€, +3 réputation).

#### 9. `EVT_HORLOGE_13H` — L’Heure Treize de Val-Ferrand
- **Contexte** : L'horloge municipale saute un cran et sonne treize coups à midi.
- **Option 1** : Pédagogie sur la mécanique de l'échappement avec Karim (+4 réputation).
- **Option 2 (Marx)** : Proclamer l'heure gratuite où les lois de la rentabilité s'arrêtent (+8 confiance, +5 réputation).
- **Option 3** : Déguster son sablé au calme (+1 réputation).

#### 10. `EVT_HAMMAM_DE_RUE` — Le Geyser d’Eau Chaude Urbain
- **Contexte** : Une fuite de chauffage urbain crée un hammam à ciel ouvert sur le trottoir des Hauts.
- **Option 1** : Poser des palettes et improviser une cure thermale de rue (+6 confiance, +4 réputation).
- **Option 2** : Balisage de sécurité préventif (+5 réputation).
- **Option 3** : Infuser des branches d'eucalyptus de Bertin (-1€, +3 vitalité, +5 confiance).

#### 11. `EVT_LAMPADAIRE_MORSE` — Le Lampadaire Mélancolique
- **Contexte** : Un réverbère clignote devant la friche.
- **Option 1** : Décoder le message morse avec Noah (« VERIFIEZ LE CONDENSATEUR », +3 confiance, +4 réputation).
- **Option 2** : Réparer le démarreur avec Karim (+5 réputation).
- **Option 3** : Conter que le réverbère dialogue avec la lune (+4 confiance).

---

### Catégorie C : Guerre Commerciale & Turbulences du Drive

#### 12. `EVT_DRONES_LANCE_PIERRES` — L’Interception des Drones du Drive
- **Contexte** : Le Drive teste des livraisons par drones ; les enfants ripostent aux marrons.
- **Option 1** : Calmer les enfants et récupérer le drone pour pièces au fablab (+6 réputation, +4 confiance).
- **Option 2** : Distribuer les chips tombées du ciel au banc des anciens (+5 confiance).
- **Option 3** : Pétition municipale citoyenne contre le survol des habitations (+8 réputation, +8 confiance).

#### 13. `EVT_COUPONS_PIRATES` — Les Bons de Réduction Impossibles
- **Contexte** : Tracts pirates promettant de la confiture Bertin gratuite chez HyperVal.
- **Option 1** : Démenti humoristique en vitrine (+6 vitalité, +6 confiance, +5 réputation).
- **Option 2** : Dégustation comparative gratuite pour convaincre les déçus (-2€, +8 vitalité, +6 réputation).
- **Option 3** : Contre-collage parodique sur les caddies du Drive (-3 réputation).

#### 14. `EVT_CLIENT_MYSTERE_ROBOT` — L’Inspecteur en Plastique
- **Contexte** : Un espion du Drive photographie les prix du marché avec un smartphone sur perche.
- **Option 1** : L’inviter à une tisane et lui montrer les comptes ouverts (+7 réputation, +5 confiance).
- **Option 2 (Taylor)** : Lui communiquer de faux horaires pour désorienter leurs algorithmes (+3 réputation).
- **Option 3** : Le chasser poliment mais fermement de la place (+3 réputation).

#### 15. `EVT_CAMION_BLOQUE` — L’Échouage du Semi-Remorque
- **Contexte** : Un 38 tonnes du Drive bloque la rue médiévale des Roses.
- **Option 1** : Guider le chauffeur avec précision (+7 réputation, +6 confiance).
- **Option 2** : Transborder les colis sur des triporteurs (+10 confiance, +8 réputation).
- **Option 3** : Regarder la manœuvre en mangeant des biscuits (+1 réputation).

#### 16. `EVT_SODA_FLUO` — L’Offensive des Canettes Chimiques Gratuites
- **Contexte** : Camionnette publicitaire distribuant des sodas bleus à la sortie des cours.
- **Option 1** : Test d'aveugle « Tisane de Bertin vs Soda fluo » (-2€, +8 vitalité, +8 réputation, +6 confiance).
- **Option 2** : Vente à prix coûtant des sablés du stand (+3 réputation).
- **Option 3** : Attendre le crash glycémique de 17h (+2 réputation).

---

### Catégorie D : Passions Citoyennes, Secrets & Rivalités

#### 17. `EVT_TOURNOI_ECHECS_NAVETS` — Le Tournoi d’Échecs sur Caisses Maraîchères
- **Contexte** : Partie d’échecs passionnée sur cageots de navets retournés.
- **Option 1** : Victoire tactique au tournoi (+5€, +7 réputation, +4 confiance).
- **Option 2** : Arbitrage diplomatique d’une prise en passant (+5 réputation).
- **Option 3** : Vente de collations aux spectateurs (+7€, +2 réputation).

#### 18. `EVT_TISANE_DE_VERITE` — La Tisane Légendaire de Mme Bertin
- **Contexte** : Décoction aux herbes sauvages déliant les langues.
- **Option 1** : En boire avec Noah pour sceller une amitié indestructible (+5 réputation, +5 confiance).
- **Option 2** : En faire boire au représentant du Drive qui avoue les pertes de son enseigne (+8 confiance, +6 réputation).
- **Option 3** : Archiver la recette secrète à la conserverie (+4 réputation).

#### 19. `EVT_DUEL_VIS_BOULONS` — Le Grand Schisme Métrique de Samir et Karim
- **Contexte** : Conflit entre pas métrique ISO et filetage Whitworth pour la bétonnière.
- **Option 1** : Usiner une bague d’adaptation hybride au tour (+8 réputation, +6 confiance).
- **Option 2** : Offrir des cafés et laisser la querelle s’éteindre (-1€, +5 confiance, +4 réputation).
- **Option 3 (Ostrom)** : Vote à main levée des apprentis (+4 confiance, +3 réputation).

#### 20. `EVT_FRESQUE_PREMONITOIRE` — L’Artiste des Murs et l’Oracle Urbain
- **Contexte** : Peinture murale énigmatique prédisant la semaine économique.
- **Option 1** : Vernir la fresque contre les pluies (-2€, +6 réputation, +4 confiance).
- **Option 2** : Décrypter l’oracle pour anticiper la demande commerciale (+4 réputation).
- **Option 3** : Recruter Louison pour l’identité graphique de la radio (+6 confiance, +5 réputation).

#### 21. `EVT_COURGE_DES_HAUTS` — La Compétition de la Courge Géante
- **Contexte** : Une courge de 48 kg menace un balcon des Hauts.
- **Option 1** : Haubanage d’ingénierie métallique avec Karim (+7 réputation, +5 confiance).
- **Option 2** : Soupe populaire géante de 80 portions (+12 confiance, +8 réputation).
- **Option 3** : Parier 2€ sur la courge du voisin (+4€, +1 réputation).

---

### Catégorie E : Joutes Philosophiques des Fantômes dans le Quotidien

#### 22. `EVT_TAYLOR_PAUSE_CAFE` — Taylor Chronomètre la Pause Café de Bertin
- **Contexte** : Taylor dénonce la perte de 720 secondes par café.
- **Option 1 (Dejours)** : Défendre la valeur humaine de la lenteur (+4 vitalité, +5 confiance, +4 réputation).
- **Option 2 (Taylor)** : Réorganiser les bocaux sans baisser le corps (+6 vitalité, +5 réputation).
- **Option 3** : Chronométrer Taylor pendant sa harangue (+3 réputation).

#### 23. `EVT_MARX_PAIN_CHOCOLAT` — Marx s’Indigne du Prix de la Viennoiserie
- **Contexte** : Pain au chocolat à 1,40€ vs rémunération paysanne.
- **Option 1 (Marx)** : Éducation populaire sur la plus-value devant les élèves (+6 réputation, +4 confiance).
- **Option 2 (Smith)** : Soutenir l'artisanat contre l'industrie surgelée (-1€, +6 confiance, +5 réputation).
- **Option 3** : Atelier brioches collectives à la friche (+8 confiance, +7 réputation).

#### 24. `EVT_OSTROM_MULTIPRISE` — La Tragédie de la Multiprise du Marché
- **Contexte** : Disjoncteur qui saute sous la surcharge d’appareils sur la place.
- **Option 1 (Ostrom)** : Charte d'usage partagé avec rotation et sanctions graduées (+10 confiance, +8 réputation).
- **Option 2 (Smith)** : Enchères d'heures de branchement (+8€, -4 confiance, -2 réputation).
- **Option 3** : Tirer une deuxième ligne avec Samir (-5€, +8 confiance, +6 réputation).

#### 25. `EVT_SMITH_BOUSCULADE_BUS` — La Main Invisible du Bus Scolaire
- **Contexte** : Bousculade à l'entrée unique du bus à 17h05.
- **Option 1 (Smith)** : Laisser faire (-2 réputation, retard et bousculades).
- **Option 2** : File alternée par classe avec Solange (+5 réputation, +4 confiance).
- **Option 3** : Rentrée à pied en bande (+6 confiance, +4 réputation).

#### 26. `EVT_KEYNES_TROUS_PARC` — Keynes Veut Creuser des Trous dans le Parc
- **Contexte** : Keynes propose de payer des ados pour creuser et reboucher des trous.
- **Option 1** : Transformer l'idée en noues d'irrigation utiles pour le potager (+10 confiance, +8 réputation).
- **Option 2** : Débat philosophique avec Keynes (+4 réputation).
- **Option 3** : Embaucher les jeunes pour distribuer le journal pirate (-4€, +6 réputation, +6 confiance).

---

### Catégorie F : Économie Émergente & Débrouille Populaire

#### 27. `EVT_BOULON_ROSE` — La Monnaie Clandestine du Quartier
- **Contexte** : Pénurie de centimes : Samir introduit l’écrou marqué d’un point rose pour 0,50€.
- **Option 1 (Hayek)** : Accepter les Boulons-Roses au stand (+8 confiance, +6 réputation).
- **Option 2** : Registre de compensation affiché chez Bertin (+4 vitalité, +6 confiance, +5 réputation).
- **Option 3 (Hobbes)** : Refuser les écrous (-3 réputation).

#### 28. `EVT_TRIPORTEUR_VOILE` — Le Bolide Éolien de Noah
- **Contexte** : Triporteur muni d’un mât dévalant la pente sans freins.
- **Option 1** : Interception héroïque sur cartons vides (+7 réputation, +5 confiance).
- **Option 2** : Crier pour faire écarter la foule (+2 réputation).
- **Option 3** : Installer de vrais freins à disque hydrauliques (-3€, +6 réputation).

#### 29. `EVT_RADIO_METEO_POETIQUE` — Le Bulletin Météo Clandestin
- **Contexte** : Poésie météo piratant la bande FM 107.4.
- **Option 1** : Enchaîner sur un flash info légumes locaux (+6 vitalité, +5 confiance, +4 réputation).
- **Option 2** : Recruter Solange pour une chronique hebdomadaire (+6 confiance, +5 réputation).
- **Option 3** : Archiver l'émission sur cassette (+3 réputation).

#### 30. `EVT_BOURSE_STICKERS_PUCES` — La Bourse Informelle de la Récréation
- **Contexte** : Spéculation sous le préau sur des stickers rares contre des puces électroniques.
- **Option 1** : Leçon sur les bulles spéculatives (+6 réputation).
- **Option 2** : Fournir des composants de la friche pour calmer les cours (+5 réputation, +4 confiance).
- **Option 3** : Créer le club officiel Repair-Collège (+6 confiance, +5 réputation).

#### 31. `EVT_TROC_CONFITURE_GRILLE_PAIN` — Le Grand Troc du Dimanche Matin
- **Contexte** : Confiture maison contre réparation d'un cordon électrique.
- **Option 1 (Dejours)** : Réparer immédiatement et partager le pot (+6 confiance, +5 réputation).
- **Option 2** : Inscrire l'échange dans la banque du temps (+8 confiance, +5 réputation).
- **Option 3 (Smith)** : Exiger 5 euros liquides (+5€, -4 confiance, -2 réputation).

#### 32. `EVT_BANQUET_DES_HERBES_FOLLES` — Le Festin Botanique des Friches
- **Contexte** : Roquette sauvage et pissenlits découverts le long des voies désaffectées.
- **Option 1 (Raworth)** : Vendre des salades sauvages à prix libre au stand (+8€, +6 réputation, +4 vitalité).
- **Option 2** : Sérigraphier un herbier pédagogique (+6 confiance, +5 réputation).
- **Option 3** : Faire certifier la terre par le lycée technique (-2€, +6 réputation).
