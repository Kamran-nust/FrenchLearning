import { useState, useEffect, useCallback, useRef } from "react";
import { Flame, Flag, Volume2, RotateCcw, X, Check, ChevronLeft, ChevronRight, BookOpen, GraduationCap, Tv, PenLine, Lock, ArrowRight, ExternalLink, Search, Sparkles, Loader2, FileEdit, Layers, Calendar } from "lucide-react";
import { fetchGrammarPages } from "./lib/grammarPages";

const DAYS = 
[{"d":1,"w":1,"c":[{"i":"d1c1","f":"bonjour","e":"hello"},{"i":"d1c2","f":"je m'appelle","e":"my name is"},{"i":"d1c3","f":"j'habite à","e":"I live in"},{"i":"d1c4","f":"je suis spécialiste en IA","e":"I am an AI specialist"},{"i":"d1c5","f":"enchanté(e)","e":"pleased to meet you"},{"i":"d1c6","f":"et vous ?","e":"and you?"}]},{"d":2,"w":1,"c":[{"i":"d2c1","f":"j'ai... ans","e":"I am ... years old"},{"i":"d2c2","f":"quel âge avez-vous ?","e":"how old are you?"},{"i":"d2c3","f":"c'est","e":"it/this is"},{"i":"d2c4","f":"ce n'est pas","e":"it is not"},{"i":"d2c5","f":"une adresse","e":"an address"},{"i":"d2c6","f":"un numéro","e":"a number"}]},{"d":3,"w":1,"c":[{"i":"d3c1","f":"un livre","e":"a book"},{"i":"d3c2","f":"une maison","e":"a house"},{"i":"d3c3","f":"une voiture","e":"a car"},{"i":"d3c4","f":"un homme","e":"a man"},{"i":"d3c5","f":"une femme","e":"a woman"},{"i":"d3c6","f":"l'école","e":"the school"},{"i":"d3c7","f":"les enfants","e":"the children"},{"i":"d3c8","f":"qu'est-ce que c'est ?","e":"what is it?"}]},{"d":4,"w":1,"c":[{"i":"d4c1","f":"je parle","e":"I speak"},{"i":"d4c2","f":"j'habite","e":"I live"},{"i":"d4c3","f":"je travaille","e":"I work"},{"i":"d4c4","f":"j'aime","e":"I like"},{"i":"d4c5","f":"vous parlez ?","e":"do you speak?"},{"i":"d4c6","f":"où travaillez-vous ?","e":"where do you work?"}]},{"d":5,"w":1,"c":[{"i":"d5c1","f":"à Toronto","e":"in Toronto"},{"i":"d5c2","f":"au Canada","e":"in Canada"},{"i":"d5c3","f":"en France","e":"in France"},{"i":"d5c4","f":"au Pakistan","e":"in Pakistan"},{"i":"d5c5","f":"aux États-Unis","e":"in the United States"},{"i":"d5c6","f":"d'où venez-vous ?","e":"where are you from?"}]},{"d":6,"w":1,"c":[{"i":"d6c1","f":"je ne suis pas","e":"I am not"},{"i":"d6c2","f":"je n'ai pas","e":"I do not have"},{"i":"d6c3","f":"je n'habite pas","e":"I do not live"},{"i":"d6c4","f":"où ?","e":"where?"},{"i":"d6c5","f":"qui ?","e":"who?"},{"i":"d6c6","f":"comment ?","e":"how/what?"},{"i":"d6c7","f":"quel/quelle ?","e":"which/what?"}]},{"d":7,"w":1,"c":[{"i":"d7c1","f":"je me présente","e":"I introduce myself"},{"i":"d7c2","f":"voici","e":"here is"},{"i":"d7c3","f":"j'aime","e":"I like"},{"i":"d7c4","f":"je n'aime pas","e":"I do not like"},{"i":"d7c5","f":"parce que","e":"because"},{"i":"d7c6","f":"en semaine","e":"on weekdays"}]},{"d":8,"w":2,"c":[{"i":"d8c1","f":"ma famille","e":"my family"},{"i":"d8c2","f":"un père","e":"a father"},{"i":"d8c3","f":"une mère","e":"a mother"},{"i":"d8c4","f":"un frère","e":"a brother"},{"i":"d8c5","f":"une sœur","e":"a sister"},{"i":"d8c6","f":"des enfants","e":"children"},{"i":"d8c7","f":"ce sont","e":"these are"}]},{"d":9,"w":2,"c":[{"i":"d9c1","f":"mon/ma/mes","e":"my"},{"i":"d9c2","f":"ton/ta/tes","e":"your"},{"i":"d9c3","f":"son/sa/ses","e":"his/her"},{"i":"d9c4","f":"mon amie","e":"my female friend"},{"i":"d9c5","f":"à qui est...?","e":"whose is...?"},{"i":"d9c6","f":"c'est à moi","e":"it is mine"}]},{"d":10,"w":2,"c":[{"i":"d10c1","f":"grand/grande","e":"tall"},{"i":"d10c2","f":"petit/petite","e":"short/small"},{"i":"d10c3","f":"gentil/gentille","e":"kind"},{"i":"d10c4","f":"intelligent/intelligente","e":"intelligent"},{"i":"d10c5","f":"sérieux/sérieuse","e":"serious"},{"i":"d10c6","f":"il/elle est","e":"he/she is"}]},{"d":11,"w":2,"c":[{"i":"d11c1","f":"une chemise","e":"a shirt"},{"i":"d11c2","f":"un pantalon","e":"trousers"},{"i":"d11c3","f":"une robe","e":"a dress"},{"i":"d11c4","f":"des chaussures","e":"shoes"},{"i":"d11c5","f":"noir/noire","e":"black"},{"i":"d11c6","f":"bleu/bleue","e":"blue"},{"i":"d11c7","f":"il/elle porte","e":"he/she wears"}]},{"d":12,"w":2,"c":[{"i":"d12c1","f":"il y a","e":"there is/are"},{"i":"d12c2","f":"dans","e":"in"},{"i":"d12c3","f":"sur","e":"on"},{"i":"d12c4","f":"sous","e":"under"},{"i":"d12c5","f":"devant","e":"in front of"},{"i":"d12c6","f":"derrière","e":"behind"},{"i":"d12c7","f":"à côté de","e":"next to"},{"i":"d12c8","f":"une chambre","e":"a bedroom"}]},{"d":13,"w":2,"c":[{"i":"d13c1","f":"zéro","e":"zero"},{"i":"d13c2","f":"un/deux","e":"one/two"},{"i":"d13c3","f":"dix","e":"ten"},{"i":"d13c4","f":"aujourd'hui","e":"today"},{"i":"d13c5","f":"demain","e":"tomorrow"},{"i":"d13c6","f":"lundi","e":"Monday"},{"i":"d13c7","f":"le 15 août","e":"August 15"},{"i":"d13c8","f":"mon numéro est","e":"my number is"}]},{"d":14,"w":2,"c":[{"i":"d14c1","f":"voici ma famille","e":"here is my family"},{"i":"d14c2","f":"nous habitons","e":"we live"},{"i":"d14c3","f":"notre maison","e":"our house"},{"i":"d14c4","f":"ensemble","e":"together"},{"i":"d14c5","f":"près de","e":"near"},{"i":"d14c6","f":"mais","e":"but"}]},{"d":15,"w":3,"c":[{"i":"d15c1","f":"quelle heure ?","e":"what time?"},{"i":"d15c2","f":"à sept heures","e":"at seven"},{"i":"d15c3","f":"le matin","e":"in the morning"},{"i":"d15c4","f":"l'après-midi","e":"in the afternoon"},{"i":"d15c5","f":"le soir","e":"in the evening"},{"i":"d15c6","f":"tôt","e":"early"},{"i":"d15c7","f":"tard","e":"late"}]},{"d":16,"w":3,"c":[{"i":"d16c1","f":"je fais","e":"I do/make"},{"i":"d16c2","f":"nous faisons","e":"we do"},{"i":"d16c3","f":"faire du sport","e":"do sport"},{"i":"d16c4","f":"faire de la cuisine","e":"cook"},{"i":"d16c5","f":"jouer au cricket","e":"play cricket"},{"i":"d16c6","f":"pendant le week-end","e":"during the weekend"}]},{"d":17,"w":3,"c":[{"i":"d17c1","f":"d'abord","e":"first"},{"i":"d17c2","f":"puis","e":"then"},{"i":"d17c3","f":"ensuite","e":"next"},{"i":"d17c4","f":"enfin","e":"finally"},{"i":"d17c5","f":"je commence","e":"I begin"},{"i":"d17c6","f":"je termine","e":"I finish"},{"i":"d17c7","f":"je rentre","e":"I return home"},{"i":"d17c8","f":"je prépare","e":"I prepare"}]},{"d":18,"w":3,"c":[{"i":"d18c1","f":"je me lève","e":"I get up"},{"i":"d18c2","f":"je me lave","e":"I wash"},{"i":"d18c3","f":"je m'habille","e":"I get dressed"},{"i":"d18c4","f":"je me couche","e":"I go to bed"},{"i":"d18c5","f":"nous nous levons","e":"we get up"},{"i":"d18c6","f":"à quelle heure...?","e":"at what time...?"}]},{"d":19,"w":3,"c":[{"i":"d19c1","f":"j'aime bien","e":"I quite like"},{"i":"d19c2","f":"j'adore","e":"I love"},{"i":"d19c3","f":"je préfère","e":"I prefer"},{"i":"d19c4","f":"je déteste","e":"I hate"},{"i":"d19c5","f":"parce que","e":"because"},{"i":"d19c6","f":"c'est intéressant","e":"it is interesting"},{"i":"d19c7","f":"à mon avis","e":"in my opinion"}]},{"d":20,"w":3,"c":[{"i":"d20c1","f":"qui ?","e":"who?"},{"i":"d20c2","f":"où ?","e":"where?"},{"i":"d20c3","f":"quand ?","e":"when?"},{"i":"d20c4","f":"comment ?","e":"how?"},{"i":"d20c5","f":"pourquoi ?","e":"why?"},{"i":"d20c6","f":"combien ?","e":"how much/many?"},{"i":"d20c7","f":"qu'est-ce que...?","e":"what...?"}]},{"d":21,"w":3,"c":[{"i":"d21c1","f":"une journée chargée","e":"a busy day"},{"i":"d21c2","f":"d'habitude","e":"usually"},{"i":"d21c3","f":"parfois","e":"sometimes"},{"i":"d21c4","f":"toujours","e":"always"},{"i":"d21c5","f":"jamais","e":"never"},{"i":"d21c6","f":"après le travail","e":"after work"},{"i":"d21c7","f":"pendant mon temps libre","e":"in my free time"}]},{"d":22,"w":4,"c":[{"i":"d22c1","f":"du pain","e":"some bread"},{"i":"d22c2","f":"de la viande","e":"some meat"},{"i":"d22c3","f":"de l'eau","e":"some water"},{"i":"d22c4","f":"des légumes","e":"some vegetables"},{"i":"d22c5","f":"le petit déjeuner","e":"breakfast"},{"i":"d22c6","f":"le déjeuner","e":"lunch"},{"i":"d22c7","f":"le dîner","e":"dinner"},{"i":"d22c8","f":"j'ai faim/soif","e":"I am hungry/thirsty"}]},{"d":23,"w":4,"c":[{"i":"d23c1","f":"je voudrais","e":"I would like"},{"i":"d23c2","f":"je veux","e":"I want"},{"i":"d23c3","f":"vous désirez ?","e":"what would you like?"},{"i":"d23c4","f":"s'il vous plaît","e":"please"},{"i":"d23c5","f":"merci","e":"thank you"},{"i":"d23c6","f":"autre chose ?","e":"anything else?"},{"i":"d23c7","f":"c'est tout","e":"that's all"}]},{"d":24,"w":4,"c":[{"i":"d24c1","f":"un kilo de","e":"a kilogram of"},{"i":"d24c2","f":"une bouteille de","e":"a bottle of"},{"i":"d24c3","f":"un paquet de","e":"a packet of"},{"i":"d24c4","f":"combien coûte...?","e":"how much is...?"},{"i":"d24c5","f":"ça fait","e":"that comes to"},{"i":"d24c6","f":"cher","e":"expensive"},{"i":"d24c7","f":"bon marché","e":"inexpensive"}]},{"d":25,"w":4,"c":[{"i":"d25c1","f":"je n'ai pas de","e":"I do not have any"},{"i":"d25c2","f":"je ne mange pas de","e":"I do not eat any"},{"i":"d25c3","f":"il n'y a pas de","e":"there is no"},{"i":"d25c4","f":"ce n'est pas un","e":"it is not a"},{"i":"d25c5","f":"rien","e":"nothing"}]},{"d":26,"w":4,"c":[{"i":"d26c1","f":"je prends","e":"I take/have"},{"i":"d26c2","f":"tu prends","e":"you take"},{"i":"d26c3","f":"nous prenons","e":"we take"},{"i":"d26c4","f":"vous prenez","e":"you take"},{"i":"d26c5","f":"prendre le petit déjeuner","e":"have breakfast"},{"i":"d26c6","f":"prendre un café","e":"have a coffee"}]},{"d":27,"w":4,"c":[{"i":"d27c1","f":"une table pour quatre","e":"a table for four"},{"i":"d27c2","f":"la carte","e":"the menu"},{"i":"d27c3","f":"comme entrée","e":"as a starter"},{"i":"d27c4","f":"comme plat","e":"as a main course"},{"i":"d27c5","f":"l'addition","e":"the bill"},{"i":"d27c6","f":"il manque","e":"...is missing"},{"i":"d27c7","f":"c'était délicieux","e":"it was delicious"}]},{"d":28,"w":4,"c":[{"i":"d28c1","f":"faire les courses","e":"shop for groceries"},{"i":"d28c2","f":"commander","e":"order"},{"i":"d28c3","f":"payer","e":"pay"},{"i":"d28c4","f":"en espèces","e":"in cash"},{"i":"d28c5","f":"par carte","e":"by card"},{"i":"d28c6","f":"combien dois-je ?","e":"how much do I owe?"},{"i":"d28c7","f":"je vais prendre","e":"I'll take"}]},{"d":29,"w":5,"c":[{"i":"d29c1","f":"je vais","e":"I go"},{"i":"d29c2","f":"nous allons","e":"we go"},{"i":"d29c3","f":"au travail","e":"to work"},{"i":"d29c4","f":"à la gare","e":"to the station"},{"i":"d29c5","f":"à l'école","e":"to school"},{"i":"d29c6","f":"en voiture","e":"by car"},{"i":"d29c7","f":"à pied","e":"on foot"},{"i":"d29c8","f":"comment allez-vous...?","e":"how do you go...?"}]},{"d":30,"w":5,"c":[{"i":"d30c1","f":"excusez-moi","e":"excuse me"},{"i":"d30c2","f":"où se trouve...?","e":"where is...?"},{"i":"d30c3","f":"allez tout droit","e":"go straight"},{"i":"d30c4","f":"tournez à gauche/droite","e":"turn left/right"},{"i":"d30c5","f":"traversez","e":"cross"},{"i":"d30c6","f":"au coin de","e":"at the corner of"},{"i":"d30c7","f":"loin/près","e":"far/near"}]},{"d":31,"w":5,"c":[{"i":"d31c1","f":"je vais travailler","e":"I am going to work"},{"i":"d31c2","f":"nous allons sortir","e":"we are going to go out"},{"i":"d31c3","f":"demain","e":"tomorrow"},{"i":"d31c4","f":"ce soir","e":"tonight"},{"i":"d31c5","f":"ce week-end","e":"this weekend"},{"i":"d31c6","f":"bientôt","e":"soon"},{"i":"d31c7","f":"qu'allez-vous faire ?","e":"what are you going to do?"}]},{"d":32,"w":5,"c":[{"i":"d32c1","f":"il fait beau","e":"weather is nice"},{"i":"d32c2","f":"il fait froid/chaud","e":"it is cold/hot"},{"i":"d32c3","f":"il pleut","e":"it is raining"},{"i":"d32c4","f":"il neige","e":"it is snowing"},{"i":"d32c5","f":"il y a du vent","e":"it is windy"},{"i":"d32c6","f":"au printemps","e":"in spring"},{"i":"d32c7","f":"selon la météo","e":"according to the forecast"}]},{"d":33,"w":5,"c":[{"i":"d33c1","f":"voulez-vous...?","e":"would you like...?"},{"i":"d33c2","f":"avec plaisir","e":"with pleasure"},{"i":"d33c3","f":"bonne idée","e":"good idea"},{"i":"d33c4","f":"désolé(e)","e":"sorry"},{"i":"d33c5","f":"je ne peux pas","e":"I cannot"},{"i":"d33c6","f":"êtes-vous libre ?","e":"are you free?"},{"i":"d33c7","f":"rendez-vous à","e":"meet at"}]},{"d":34,"w":5,"c":[{"i":"d34c1","f":"en général","e":"generally"},{"i":"d34c2","f":"pendant la semaine","e":"during the week"},{"i":"d34c3","f":"le week-end prochain","e":"next weekend"},{"i":"d34c4","f":"pour aller à","e":"to get to"},{"i":"d34c5","f":"je voudrais","e":"I would like"},{"i":"d34c6","f":"mon objectif","e":"my goal"}]},{"d":35,"w":5,"c":[{"i":"d35c1","f":"je peux me présenter","e":"I can introduce myself"},{"i":"d35c2","f":"je peux demander","e":"I can ask"},{"i":"d35c3","f":"j'ai besoin de pratiquer","e":"I need to practise"},{"i":"d35c4","f":"mon point fort","e":"my strength"},{"i":"d35c5","f":"ma difficulté","e":"my difficulty"},{"i":"d35c6","f":"la prochaine étape","e":"the next step"}]},{"d":36,"w":6,"c":[{"i":"d36c1","f":"la tête","e":"head"},{"i":"d36c2","f":"les yeux","e":"eyes"},{"i":"d36c3","f":"le nez","e":"nose"},{"i":"d36c4","f":"la bouche","e":"mouth"},{"i":"d36c5","f":"le bras","e":"arm"},{"i":"d36c6","f":"la main","e":"hand"},{"i":"d36c7","f":"la jambe","e":"leg"},{"i":"d36c8","f":"le dos","e":"back"}]},{"d":37,"w":6,"c":[{"i":"d37c1","f":"avoir mal à","e":"to hurt"},{"i":"d37c2","f":"la fièvre","e":"fever"},{"i":"d37c3","f":"un rhume","e":"a cold"},{"i":"d37c4","f":"tousser","e":"cough"},{"i":"d37c5","f":"être malade","e":"be ill"},{"i":"d37c6","f":"être fatigué","e":"be tired"},{"i":"d37c7","f":"depuis hier","e":"since yesterday"},{"i":"d37c8","f":"beaucoup","e":"a lot"}]},{"d":38,"w":6,"c":[{"i":"d38c1","f":"une pharmacie","e":"pharmacy"},{"i":"d38c2","f":"un médicament","e":"medicine"},{"i":"d38c3","f":"une ordonnance","e":"prescription"},{"i":"d38c4","f":"des comprimés","e":"tablets"},{"i":"d38c5","f":"combien de fois ?","e":"how many times?"},{"i":"d38c6","f":"pouvoir","e":"can"},{"i":"d38c7","f":"conseiller","e":"recommend"},{"i":"d38c8","f":"contre la douleur","e":"for pain"}]},{"d":39,"w":6,"c":[{"i":"d39c1","f":"vous devez","e":"you must"},{"i":"d39c2","f":"il faut","e":"it is necessary"},{"i":"d39c3","f":"se reposer","e":"rest"},{"i":"d39c4","f":"boire de l'eau","e":"drink water"},{"i":"d39c5","f":"dormir","e":"sleep"},{"i":"d39c6","f":"prendre","e":"take"},{"i":"d39c7","f":"rester à la maison","e":"stay home"},{"i":"d39c8","f":"aller mieux","e":"feel better"}]},{"d":40,"w":6,"c":[{"i":"d40c1","f":"un rendez-vous","e":"appointment"},{"i":"d40c2","f":"disponible","e":"available"},{"i":"d40c3","f":"mardi prochain","e":"next Tuesday"},{"i":"d40c4","f":"à quinze heures","e":"at 3 p.m"},{"i":"d40c5","f":"ça vous convient ?","e":"does that suit you?"},{"i":"d40c6","f":"déplacer","e":"reschedule"},{"i":"d40c7","f":"confirmer","e":"confirm"},{"i":"d40c8","f":"venir","e":"come"}]},{"d":41,"w":6,"c":[{"i":"d41c1","f":"être en forme","e":"be fit"},{"i":"d41c2","f":"faire de l'exercice","e":"exercise"},{"i":"d41c3","f":"manger équilibré","e":"eat a balanced diet"},{"i":"d41c4","f":"souvent","e":"often"},{"i":"d41c5","f":"parfois","e":"sometimes"},{"i":"d41c6","f":"rarement","e":"rarely"},{"i":"d41c7","f":"chaque jour","e":"every day"},{"i":"d41c8","f":"suffisamment","e":"enough"}]},{"d":42,"w":6,"c":[{"i":"d42c1","f":"un symptôme","e":"symptom"},{"i":"d42c2","f":"expliquer","e":"explain"},{"i":"d42c3","f":"conseiller","e":"advise"},{"i":"d42c4","f":"un rendez-vous","e":"appointment"},{"i":"d42c5","f":"se sentir","e":"feel"},{"i":"d42c6","f":"mieux","e":"better"},{"i":"d42c7","f":"pire","e":"worse"},{"i":"d42c8","f":"en bonne santé","e":"healthy"}]},{"d":43,"w":7,"c":[{"i":"d43c1","f":"la mairie","e":"town hall"},{"i":"d43c2","f":"la banque","e":"bank"},{"i":"d43c3","f":"la poste","e":"post office"},{"i":"d43c4","f":"la bibliothèque","e":"library"},{"i":"d43c5","f":"le supermarché","e":"supermarket"},{"i":"d43c6","f":"le quartier","e":"neighbourhood"},{"i":"d43c7","f":"près de","e":"near"},{"i":"d43c8","f":"loin de","e":"far from"}]},{"d":44,"w":7,"c":[{"i":"d44c1","f":"un arrêt","e":"stop"},{"i":"d44c2","f":"une station","e":"station"},{"i":"d44c3","f":"un billet","e":"ticket"},{"i":"d44c4","f":"un aller simple","e":"one-way ticket"},{"i":"d44c5","f":"un aller-retour","e":"return ticket"},{"i":"d44c6","f":"changer","e":"transfer"},{"i":"d44c7","f":"descendre","e":"get off"},{"i":"d44c8","f":"le prochain bus","e":"next bus"}]},{"d":45,"w":7,"c":[{"i":"d45c1","f":"envoyer","e":"send"},{"i":"d45c2","f":"une lettre","e":"letter"},{"i":"d45c3","f":"un colis","e":"parcel"},{"i":"d45c4","f":"un timbre","e":"stamp"},{"i":"d45c5","f":"peser","e":"weigh"},{"i":"d45c6","f":"remplir","e":"fill in"},{"i":"d45c7","f":"signer","e":"sign"},{"i":"d45c8","f":"l'adresse du destinataire","e":"recipient address"}]},{"d":46,"w":7,"c":[{"i":"d46c1","f":"un compte","e":"account"},{"i":"d46c2","f":"ouvrir","e":"open"},{"i":"d46c3","f":"déposer","e":"deposit"},{"i":"d46c4","f":"retirer","e":"withdraw"},{"i":"d46c5","f":"une carte bancaire","e":"bank card"},{"i":"d46c6","f":"une pièce d'identité","e":"ID"},{"i":"d46c7","f":"un formulaire","e":"form"},{"i":"d46c8","f":"un guichet","e":"counter"}]},{"d":47,"w":7,"c":[{"i":"d47c1","f":"plus calme que","e":"quieter than"},{"i":"d47c2","f":"moins cher que","e":"cheaper than"},{"i":"d47c3","f":"aussi pratique que","e":"as practical as"},{"i":"d47c4","f":"animé","e":"lively"},{"i":"d47c5","f":"sûr/sûre","e":"safe"},{"i":"d47c6","f":"propre","e":"clean"},{"i":"d47c7","f":"bruyant","e":"noisy"},{"i":"d47c8","f":"à mon avis","e":"in my opinion"}]},{"d":48,"w":7,"c":[{"i":"d48c1","f":"des renseignements","e":"information"},{"i":"d48c2","f":"les horaires","e":"opening hours"},{"i":"d48c3","f":"ouvert/fermé","e":"open/closed"},{"i":"d48c4","f":"à quelle heure ?","e":"at what time?"},{"i":"d48c5","f":"comment aller à...?","e":"how to get to...?"},{"i":"d48c6","f":"est-ce qu'il y a...?","e":"is there...?"},{"i":"d48c7","f":"gratuit","e":"free"},{"i":"d48c8","f":"une entrée","e":"admission"}]},{"d":49,"w":7,"c":[{"i":"d49c1","f":"se déplacer","e":"get around"},{"i":"d49c2","f":"un service","e":"service"},{"i":"d49c3","f":"demander de l'aide","e":"ask for help"},{"i":"d49c4","f":"expliquer un problème","e":"explain a problem"},{"i":"d49c5","f":"pratique","e":"convenient"},{"i":"d49c6","f":"rapide","e":"fast"},{"i":"d49c7","f":"disponible","e":"available"},{"i":"d49c8","f":"fermé","e":"closed"}]},{"d":50,"w":8,"c":[{"i":"d50c1","f":"hier","e":"yesterday"},{"i":"d50c2","f":"j'ai parlé","e":"I spoke"},{"i":"d50c3","f":"j'ai travaillé","e":"I worked"},{"i":"d50c4","f":"j'ai regardé","e":"I watched"},{"i":"d50c5","f":"j'ai préparé","e":"I prepared"},{"i":"d50c6","f":"j'ai visité","e":"I visited"},{"i":"d50c7","f":"déjà","e":"already"},{"i":"d50c8","f":"enfin","e":"finally"}]},{"d":51,"w":8,"c":[{"i":"d51c1","f":"j'ai eu","e":"I had"},{"i":"d51c2","f":"j'ai fait","e":"I did"},{"i":"d51c3","f":"j'ai pris","e":"I took"},{"i":"d51c4","f":"j'ai vu","e":"I saw"},{"i":"d51c5","f":"j'ai lu","e":"I read"},{"i":"d51c6","f":"j'ai bu","e":"I drank"},{"i":"d51c7","f":"la semaine dernière","e":"last week"},{"i":"d51c8","f":"soudain","e":"suddenly"}]},{"d":52,"w":8,"c":[{"i":"d52c1","f":"je n'ai pas parlé","e":"I did not speak"},{"i":"d52c2","f":"je n'ai rien acheté","e":"I bought nothing"},{"i":"d52c3","f":"pas encore","e":"not yet"},{"i":"d52c4","f":"jamais","e":"never"},{"i":"d52c5","f":"ce matin","e":"this morning"},{"i":"d52c6","f":"finalement","e":"finally"},{"i":"d52c7","f":"oublier","e":"forget"},{"i":"d52c8","f":"terminer","e":"finish"}]},{"d":53,"w":8,"c":[{"i":"d53c1","f":"qu'est-ce que tu as fait ?","e":"what did you do?"},{"i":"d53c2","f":"où êtes-vous allé ?","e":"where did you go?"},{"i":"d53c3","f":"avec qui ?","e":"with whom?"},{"i":"d53c4","f":"quand ?","e":"when?"},{"i":"d53c5","f":"pourquoi ?","e":"why?"},{"i":"d53c6","f":"combien de temps ?","e":"how long?"},{"i":"d53c7","f":"puis","e":"then"},{"i":"d53c8","f":"après","e":"afterward"}]},{"d":54,"w":8,"c":[{"i":"d54c1","f":"d'abord","e":"first"},{"i":"d54c2","f":"ensuite","e":"next"},{"i":"d54c3","f":"après","e":"afterward"},{"i":"d54c4","f":"plus tard","e":"later"},{"i":"d54c5","f":"enfin","e":"finally"},{"i":"d54c6","f":"pendant","e":"during"},{"i":"d54c7","f":"vers huit heures","e":"around eight"},{"i":"d54c8","f":"toute la journée","e":"all day"}]},{"d":55,"w":8,"c":[{"i":"d55c1","f":"un événement","e":"event"},{"i":"d55c2","f":"arriver","e":"arrive"},{"i":"d55c3","f":"commencer","e":"begin"},{"i":"d55c4","f":"passer du temps","e":"spend time"},{"i":"d55c5","f":"rencontrer","e":"meet"},{"i":"d55c6","f":"rentrer","e":"return"},{"i":"d55c7","f":"raconter","e":"tell"},{"i":"d55c8","f":"se passer","e":"happen"}]},{"d":56,"w":8,"c":[{"i":"d56c1","f":"raconter","e":"recount"},{"i":"d56c2","f":"une expérience","e":"experience"},{"i":"d56c3","f":"récemment","e":"recently"},{"i":"d56c4","f":"la dernière fois","e":"last time"},{"i":"d56c5","f":"se souvenir","e":"remember"},{"i":"d56c6","f":"oublier","e":"forget"},{"i":"d56c7","f":"pendant que","e":"while"},{"i":"d56c8","f":"à la fin","e":"at the end"}]},{"d":57,"w":9,"c":[{"i":"d57c1","f":"un voyage","e":"trip"},{"i":"d57c2","f":"réserver","e":"book"},{"i":"d57c3","f":"un départ","e":"departure"},{"i":"d57c4","f":"une arrivée","e":"arrival"},{"i":"d57c5","f":"un itinéraire","e":"itinerary"},{"i":"d57c6","f":"la semaine prochaine","e":"next week"},{"i":"d57c7","f":"d'abord","e":"first"},{"i":"d57c8","f":"prévoir","e":"plan"}]},{"d":58,"w":9,"c":[{"i":"d58c1","f":"une chambre simple/double","e":"single/double room"},{"i":"d58c2","f":"une réservation","e":"booking"},{"i":"d58c3","f":"une nuit","e":"night"},{"i":"d58c4","f":"le petit déjeuner compris","e":"breakfast included"},{"i":"d58c5","f":"une clé","e":"key"},{"i":"d58c6","f":"disponible","e":"available"},{"i":"d58c7","f":"complet","e":"full"},{"i":"d58c8","f":"à quel nom ?","e":"under what name?"}]},{"d":59,"w":9,"c":[{"i":"d59c1","f":"la chambre est sale","e":"room is dirty"},{"i":"d59c2","f":"le chauffage","e":"heating"},{"i":"d59c3","f":"la climatisation","e":"air conditioning"},{"i":"d59c4","f":"ne fonctionne pas","e":"does not work"},{"i":"d59c5","f":"il manque","e":"is missing"},{"i":"d59c6","f":"changer de chambre","e":"change rooms"},{"i":"d59c7","f":"réparer","e":"repair"},{"i":"d59c8","f":"tout de suite","e":"right away"}]},{"d":60,"w":9,"c":[{"i":"d60c1","f":"un quai","e":"platform"},{"i":"d60c2","f":"une voie","e":"track"},{"i":"d60c3","f":"en retard","e":"delayed"},{"i":"d60c4","f":"à l'heure","e":"on time"},{"i":"d60c5","f":"annuler","e":"cancel"},{"i":"d60c6","f":"une correspondance","e":"connection"},{"i":"d60c7","f":"embarquer","e":"board"},{"i":"d60c8","f":"les bagages","e":"luggage"}]},{"d":61,"w":9,"c":[{"i":"d61c1","f":"je suis allé(e)","e":"I went"},{"i":"d61c2","f":"je suis arrivé(e)","e":"I arrived"},{"i":"d61c3","f":"je suis parti(e)","e":"I left"},{"i":"d61c4","f":"je suis rentré(e)","e":"I returned"},{"i":"d61c5","f":"nous sommes venus","e":"we came"},{"i":"d61c6","f":"elle est sortie","e":"she went out"},{"i":"d61c7","f":"tôt","e":"early"},{"i":"d61c8","f":"tard","e":"late"}]},{"d":62,"w":9,"c":[{"i":"d62c1","f":"le séjour","e":"stay"},{"i":"d62c2","f":"visiter","e":"visit"},{"i":"d62c3","f":"découvrir","e":"discover"},{"i":"d62c4","f":"prendre des photos","e":"take photos"},{"i":"d62c5","f":"goûter","e":"taste"},{"i":"d62c6","f":"rester","e":"stay"},{"i":"d62c7","f":"merveilleux","e":"wonderful"},{"i":"d62c8","f":"malheureusement","e":"unfortunately"}]},{"d":63,"w":9,"c":[{"i":"d63c1","f":"organiser","e":"organize"},{"i":"d63c2","f":"confirmer","e":"confirm"},{"i":"d63c3","f":"se renseigner","e":"get information"},{"i":"d63c4","f":"un imprévu","e":"unexpected event"},{"i":"d63c5","f":"résoudre","e":"solve"},{"i":"d63c6","f":"profiter de","e":"enjoy"},{"i":"d63c7","f":"à l'étranger","e":"abroad"},{"i":"d63c8","f":"revenir","e":"return"}]},{"d":64,"w":10,"c":[{"i":"d64c1","f":"un collègue","e":"colleague"},{"i":"d64c2","f":"un client","e":"client"},{"i":"d64c3","f":"un bureau","e":"office"},{"i":"d64c4","f":"une entreprise","e":"company"},{"i":"d64c5","f":"une réunion","e":"meeting"},{"i":"d64c6","f":"un projet","e":"project"},{"i":"d64c7","f":"travailler sur","e":"work on"},{"i":"d64c8","f":"responsable de","e":"responsible for"}]},{"d":65,"w":10,"c":[{"i":"d65c1","f":"une compétence","e":"skill"},{"i":"d65c2","f":"savoir utiliser","e":"know how to use"},{"i":"d65c3","f":"connaître","e":"be familiar with"},{"i":"d65c4","f":"pouvoir expliquer","e":"can explain"},{"i":"d65c5","f":"apprendre","e":"learn"},{"i":"d65c6","f":"améliorer","e":"improve"},{"i":"d65c7","f":"expérimenté","e":"experienced"},{"i":"d65c8","f":"débutant","e":"beginner"}]},{"d":66,"w":10,"c":[{"i":"d66c1","f":"une règle","e":"rule"},{"i":"d66c2","f":"une consigne","e":"instruction"},{"i":"d66c3","f":"respecter","e":"follow/respect"},{"i":"d66c4","f":"être à l'heure","e":"be on time"},{"i":"d66c5","f":"terminer à temps","e":"finish on time"},{"i":"d66c6","f":"demander la permission","e":"ask permission"},{"i":"d66c7","f":"interdit","e":"prohibited"},{"i":"d66c8","f":"obligatoire","e":"mandatory"}]},{"d":67,"w":10,"c":[{"i":"d67c1","f":"terminé","e":"finished"},{"i":"d67c2","f":"en cours","e":"in progress"},{"i":"d67c3","f":"commencer","e":"start"},{"i":"d67c4","f":"un problème","e":"problem"},{"i":"d67c5","f":"une solution","e":"solution"},{"i":"d67c6","f":"la prochaine étape","e":"next step"},{"i":"d67c7","f":"avant vendredi","e":"before Friday"},{"i":"d67c8","f":"pour le moment","e":"for now"}]},{"d":68,"w":10,"c":[{"i":"d68c1","f":"bonjour Madame/Monsieur","e":"hello Ms/Mr"},{"i":"d68c2","f":"je vous écris pour","e":"I am writing to"},{"i":"d68c3","f":"pourriez-vous...?","e":"could you...?"},{"i":"d68c4","f":"merci d'avance","e":"thanks in advance"},{"i":"d68c5","f":"cordialement","e":"kind regards"},{"i":"d68c6","f":"à bientôt","e":"see you soon"},{"i":"d68c7","f":"objet","e":"subject"},{"i":"d68c8","f":"pièce jointe","e":"attachment"}]},{"d":69,"w":10,"c":[{"i":"d69c1","f":"depuis cinq semaines","e":"for five weeks"},{"i":"d69c2","f":"faire des progrès","e":"make progress"},{"i":"d69c3","f":"avoir du mal à","e":"have difficulty"},{"i":"d69c4","f":"comprendre","e":"understand"},{"i":"d69c5","f":"prononcer","e":"pronounce"},{"i":"d69c6","f":"régulièrement","e":"regularly"},{"i":"d69c7","f":"un objectif","e":"goal"},{"i":"d69c8","f":"continuer","e":"continue"}]},{"d":70,"w":10,"c":[{"i":"d70c1","f":"faire le bilan","e":"take stock"},{"i":"d70c2","f":"réussir","e":"succeed"},{"i":"d70c3","f":"une erreur fréquente","e":"frequent error"},{"i":"d70c4","f":"un point fort","e":"strength"},{"i":"d70c5","f":"un point faible","e":"weakness"},{"i":"d70c6","f":"réviser","e":"review"},{"i":"d70c7","f":"s'entraîner","e":"practise"},{"i":"d70c8","f":"prochaine priorité","e":"next priority"}]},{"d":71,"w":11,"c":[{"i":"d71c1","f":"cette chemise","e":"this shirt"},{"i":"d71c2","f":"ce pantalon","e":"these trousers"},{"i":"d71c3","f":"ces chaussures","e":"these shoes"},{"i":"d71c4","f":"une taille","e":"size"},{"i":"d71c5","f":"essayer","e":"try on"},{"i":"d71c6","f":"la cabine","e":"fitting room"},{"i":"d71c7","f":"trop grand","e":"too big"},{"i":"d71c8","f":"trop petit","e":"too small"}]},{"d":72,"w":11,"c":[{"i":"d72c1","f":"un petit sac noir","e":"a small black bag"},{"i":"d72c2","f":"une belle veste","e":"a beautiful jacket"},{"i":"d72c3","f":"un téléphone moderne","e":"a modern phone"},{"i":"d72c4","f":"léger/légère","e":"light"},{"i":"d72c5","f":"lourd/lourde","e":"heavy"},{"i":"d72c6","f":"utile","e":"useful"},{"i":"d72c7","f":"solide","e":"sturdy"},{"i":"d72c8","f":"en bon état","e":"in good condition"}]},{"d":73,"w":11,"c":[{"i":"d73c1","f":"moins cher","e":"cheaper"},{"i":"d73c2","f":"plus pratique","e":"more practical"},{"i":"d73c3","f":"aussi solide","e":"as sturdy"},{"i":"d73c4","f":"le meilleur choix","e":"best choice"},{"i":"d73c5","f":"le plus cher","e":"most expensive"},{"i":"d73c6","f":"une réduction","e":"discount"},{"i":"d73c7","f":"le prix","e":"price"},{"i":"d73c8","f":"la qualité","e":"quality"}]},{"d":74,"w":11,"c":[{"i":"d74c1","f":"je le prends","e":"I'll take it"},{"i":"d74c2","f":"je la préfère","e":"I prefer it"},{"i":"d74c3","f":"je les essaie","e":"I try them on"},{"i":"d74c4","f":"vous l'avez ?","e":"do you have it?"},{"i":"d74c5","f":"regarder","e":"look at"},{"i":"d74c6","f":"choisir","e":"choose"},{"i":"d74c7","f":"montrer","e":"show"},{"i":"d74c8","f":"acheter","e":"buy"}]},{"d":75,"w":11,"c":[{"i":"d75c1","f":"un reçu","e":"receipt"},{"i":"d75c2","f":"rembourser","e":"refund"},{"i":"d75c3","f":"échanger","e":"exchange"},{"i":"d75c4","f":"défectueux","e":"defective"},{"i":"d75c5","f":"ne convient pas","e":"does not suit"},{"i":"d75c6","f":"la mauvaise taille","e":"wrong size"},{"i":"d75c7","f":"acheté hier","e":"bought yesterday"},{"i":"d75c8","f":"avoir le droit de","e":"be allowed to"}]},{"d":76,"w":11,"c":[{"i":"d76c1","f":"un site fiable","e":"reliable site"},{"i":"d76c2","f":"une commande","e":"order"},{"i":"d76c3","f":"livrer","e":"deliver"},{"i":"d76c4","f":"les frais de livraison","e":"shipping fees"},{"i":"d76c5","f":"un avis","e":"review"},{"i":"d76c6","f":"qui fonctionne","e":"that works"},{"i":"d76c7","f":"que j'ai commandé","e":"that I ordered"},{"i":"d76c8","f":"sécurisé","e":"secure"}]},{"d":77,"w":11,"c":[{"i":"d77c1","f":"faire un choix","e":"make a choice"},{"i":"d77c2","f":"comparer","e":"compare"},{"i":"d77c3","f":"convenir","e":"suit"},{"i":"d77c4","f":"recommander","e":"recommend"},{"i":"d77c5","f":"être satisfait","e":"be satisfied"},{"i":"d77c6","f":"rendre","e":"return"},{"i":"d77c7","f":"garder","e":"keep"},{"i":"d77c8","f":"finalement","e":"finally"}]},{"d":78,"w":12,"c":[{"i":"d78c1","f":"un appartement","e":"apartment"},{"i":"d78c2","f":"une maison individuelle","e":"detached house"},{"i":"d78c3","f":"un immeuble","e":"apartment building"},{"i":"d78c4","f":"un étage","e":"floor"},{"i":"d78c5","f":"un balcon","e":"balcony"},{"i":"d78c6","f":"meublé","e":"furnished"},{"i":"d78c7","f":"lumineux","e":"bright"},{"i":"d78c8","f":"spacieux","e":"spacious"}]},{"d":79,"w":12,"c":[{"i":"d79c1","f":"le loyer","e":"rent"},{"i":"d79c2","f":"charges comprises","e":"utilities included"},{"i":"d79c3","f":"disponible","e":"available"},{"i":"d79c4","f":"une visite","e":"viewing"},{"i":"d79c5","f":"un propriétaire","e":"landlord"},{"i":"d79c6","f":"un locataire","e":"tenant"},{"i":"d79c7","f":"une caution","e":"deposit"},{"i":"d79c8","f":"près des transports","e":"near transit"}]},{"d":80,"w":12,"c":[{"i":"d80c1","f":"depuis quand ?","e":"since when?"},{"i":"d80c2","f":"combien de pièces ?","e":"how many rooms?"},{"i":"d80c3","f":"le chauffage","e":"heating"},{"i":"d80c4","f":"compris dans","e":"included in"},{"i":"d80c5","f":"accepter les animaux","e":"allow pets"},{"i":"d80c6","f":"un stationnement","e":"parking"},{"i":"d80c7","f":"le voisinage","e":"neighbourhood"},{"i":"d80c8","f":"signer un bail","e":"sign a lease"}]},{"d":81,"w":12,"c":[{"i":"d81c1","f":"déménager","e":"move house"},{"i":"d81c2","f":"faire des cartons","e":"pack boxes"},{"i":"d81c3","f":"un camion","e":"truck"},{"i":"d81c4","f":"porter","e":"carry"},{"i":"d81c5","f":"installer","e":"install"},{"i":"d81c6","f":"venir de finir","e":"have just finished"},{"i":"d81c7","f":"être en train de","e":"be in the middle of"},{"i":"d81c8","f":"bientôt","e":"soon"}]},{"d":82,"w":12,"c":[{"i":"d82c1","f":"une fuite","e":"leak"},{"i":"d82c2","f":"une panne","e":"breakdown"},{"i":"d82c3","f":"cassé","e":"broken"},{"i":"d82c4","f":"réparer","e":"repair"},{"i":"d82c5","f":"un plombier","e":"plumber"},{"i":"d82c6","f":"un électricien","e":"electrician"},{"i":"d82c7","f":"urgent","e":"urgent"},{"i":"d82c8","f":"dès que possible","e":"as soon as possible"}]},{"d":83,"w":12,"c":[{"i":"d83c1","f":"faire du bruit","e":"make noise"},{"i":"d83c2","f":"déranger","e":"disturb"},{"i":"d83c3","f":"baisser la musique","e":"lower music"},{"i":"d83c4","f":"s'excuser","e":"apologize"},{"i":"d83c5","f":"prévenir","e":"inform/warn"},{"i":"d83c6","f":"après vingt-deux heures","e":"after 10 p.m"},{"i":"d83c7","f":"je comprends","e":"I understand"},{"i":"d83c8","f":"trouver une solution","e":"find a solution"}]},{"d":84,"w":12,"c":[{"i":"d84c1","f":"chercher","e":"search"},{"i":"d84c2","f":"louer","e":"rent"},{"i":"d84c3","f":"visiter","e":"view"},{"i":"d84c4","f":"emménager","e":"move in"},{"i":"d84c5","f":"signaler","e":"report"},{"i":"d84c6","f":"résoudre","e":"resolve"},{"i":"d84c7","f":"un avantage","e":"advantage"},{"i":"d84c8","f":"un inconvénient","e":"disadvantage"}]},{"d":85,"w":13,"c":[{"i":"d85c1","f":"je travaillerai","e":"I will work"},{"i":"d85c2","f":"nous visiterons","e":"we will visit"},{"i":"d85c3","f":"tu finiras","e":"you will finish"},{"i":"d85c4","f":"demain","e":"tomorrow"},{"i":"d85c5","f":"l'année prochaine","e":"next year"},{"i":"d85c6","f":"plus tard","e":"later"},{"i":"d85c7","f":"un jour","e":"one day"},{"i":"d85c8","f":"à l'avenir","e":"in the future"}]},{"d":86,"w":13,"c":[{"i":"d86c1","f":"je serai","e":"I will be"},{"i":"d86c2","f":"j'aurai","e":"I will have"},{"i":"d86c3","f":"j'irai","e":"I will go"},{"i":"d86c4","f":"je ferai","e":"I will do"},{"i":"d86c5","f":"je pourrai","e":"I will be able"},{"i":"d86c6","f":"je voudrai","e":"I will want"},{"i":"d86c7","f":"bientôt","e":"soon"},{"i":"d86c8","f":"probablement","e":"probably"}]},{"d":87,"w":13,"c":[{"i":"d87c1","f":"ça te dit de...?","e":"do you feel like...?"},{"i":"d87c2","f":"voulez-vous venir ?","e":"would you like to come?"},{"i":"d87c3","f":"je vous invite","e":"I invite you"},{"i":"d87c4","f":"disponible","e":"available"},{"i":"d87c5","f":"confirmer","e":"confirm"},{"i":"d87c6","f":"apporter","e":"bring"},{"i":"d87c7","f":"avec plaisir","e":"gladly"},{"i":"d87c8","f":"malheureusement","e":"unfortunately"}]},{"d":88,"w":13,"c":[{"i":"d88c1","f":"reporter","e":"postpone"},{"i":"d88c2","f":"annuler","e":"cancel"},{"i":"d88c3","f":"un empêchement","e":"conflict"},{"i":"d88c4","f":"être disponible","e":"be available"},{"i":"d88c5","f":"plutôt","e":"instead"},{"i":"d88c6","f":"cela vous convient ?","e":"does that suit you?"},{"i":"d88c7","f":"désolé du changement","e":"sorry for the change"},{"i":"d88c8","f":"confirmer","e":"confirm"}]},{"d":89,"w":13,"c":[{"i":"d89c1","f":"s'il fait beau","e":"if weather is nice"},{"i":"d89c2","f":"s'il pleut","e":"if it rains"},{"i":"d89c3","f":"si je peux","e":"if I can"},{"i":"d89c4","f":"nous irons","e":"we will go"},{"i":"d89c5","f":"nous resterons","e":"we will stay"},{"i":"d89c6","f":"dans ce cas","e":"in that case"},{"i":"d89c7","f":"sinon","e":"otherwise"},{"i":"d89c8","f":"cela dépend","e":"it depends"}]},{"d":90,"w":13,"c":[{"i":"d90c1","f":"se mettre d'accord","e":"agree"},{"i":"d90c2","f":"proposer","e":"suggest"},{"i":"d90c3","f":"choisir","e":"choose"},{"i":"d90c4","f":"réserver","e":"book"},{"i":"d90c5","f":"chacun","e":"each person"},{"i":"d90c6","f":"être chargé de","e":"be responsible for"},{"i":"d90c7","f":"se retrouver","e":"meet"},{"i":"d90c8","f":"décider","e":"decide"}]},{"d":91,"w":13,"c":[{"i":"d91c1","f":"prévoir","e":"plan"},{"i":"d91c2","f":"modifier","e":"change"},{"i":"d91c3","f":"accepter","e":"accept"},{"i":"d91c4","f":"refuser","e":"refuse"},{"i":"d91c5","f":"proposer","e":"suggest"},{"i":"d91c6","f":"décider","e":"decide"},{"i":"d91c7","f":"si tout va bien","e":"if all goes well"},{"i":"d91c8","f":"au dernier moment","e":"at the last minute"}]},{"d":92,"w":14,"c":[{"i":"d92c1","f":"un ordinateur portable","e":"laptop"},{"i":"d92c2","f":"un écran","e":"screen"},{"i":"d92c3","f":"un clavier","e":"keyboard"},{"i":"d92c4","f":"une application","e":"app"},{"i":"d92c5","f":"télécharger","e":"download"},{"i":"d92c6","f":"enregistrer","e":"save"},{"i":"d92c7","f":"se connecter","e":"log in"},{"i":"d92c8","f":"pour travailler","e":"to work"}]},{"d":93,"w":14,"c":[{"i":"d93c1","f":"l'écran est bloqué","e":"screen is frozen"},{"i":"d93c2","f":"la connexion","e":"connection"},{"i":"d93c3","f":"un mot de passe","e":"password"},{"i":"d93c4","f":"redémarrer","e":"restart"},{"i":"d93c5","f":"mettre à jour","e":"update"},{"i":"d93c6","f":"ne marche plus","e":"no longer works"},{"i":"d93c7","f":"rien ne se passe","e":"nothing happens"},{"i":"d93c8","f":"une erreur","e":"error"}]},{"d":94,"w":14,"c":[{"i":"d94c1","f":"cliquez sur","e":"click on"},{"i":"d94c2","f":"ouvrez","e":"open"},{"i":"d94c3","f":"choisissez","e":"choose"},{"i":"d94c4","f":"saisissez","e":"enter/type"},{"i":"d94c5","f":"attendez","e":"wait"},{"i":"d94c6","f":"ne fermez pas","e":"do not close"},{"i":"d94c7","f":"vérifiez","e":"check"},{"i":"d94c8","f":"ensuite","e":"next"}]},{"d":95,"w":14,"c":[{"i":"d95c1","f":"les informations","e":"news"},{"i":"d95c2","f":"un article","e":"article"},{"i":"d95c3","f":"un reportage","e":"report"},{"i":"d95c4","f":"annoncer","e":"announce"},{"i":"d95c5","f":"selon","e":"according to"},{"i":"d95c6","f":"avoir lieu","e":"take place"},{"i":"d95c7","f":"récemment","e":"recently"},{"i":"d95c8","f":"une source","e":"source"}]},{"d":96,"w":14,"c":[{"i":"d96c1","f":"je pense que","e":"I think that"},{"i":"d96c2","f":"je trouve que","e":"I find/think"},{"i":"d96c3","f":"je crois que","e":"I believe"},{"i":"d96c4","f":"utile","e":"useful"},{"i":"d96c5","f":"fiable","e":"reliable"},{"i":"d96c6","f":"intéressant","e":"interesting"},{"i":"d96c7","f":"perdre du temps","e":"waste time"},{"i":"d96c8","f":"vérifier les sources","e":"check sources"}]},{"d":97,"w":14,"c":[{"i":"d97c1","f":"laisser un message","e":"leave a message"},{"i":"d97c2","f":"rappeler","e":"call back"},{"i":"d97c3","f":"dire que","e":"say that"},{"i":"d97c4","f":"prévenir que","e":"inform that"},{"i":"d97c5","f":"être absent","e":"be absent"},{"i":"d97c6","f":"dès que possible","e":"as soon as possible"},{"i":"d97c7","f":"transmettre","e":"pass on"},{"i":"d97c8","f":"joindre","e":"reach/contact"}]},{"d":98,"w":14,"c":[{"i":"d98c1","f":"communiquer","e":"communicate"},{"i":"d98c2","f":"partager","e":"share"},{"i":"d98c3","f":"protéger","e":"protect"},{"i":"d98c4","f":"vérifier","e":"verify"},{"i":"d98c5","f":"résoudre","e":"solve"},{"i":"d98c6","f":"transmettre","e":"relay"},{"i":"d98c7","f":"être au courant","e":"be aware"},{"i":"d98c8","f":"faire attention","e":"be careful"}]},{"d":99,"w":15,"c":[{"i":"d99c1","f":"à mon avis","e":"in my opinion"},{"i":"d99c2","f":"selon moi","e":"in my view"},{"i":"d99c3","f":"je suis d'accord","e":"I agree"},{"i":"d99c4","f":"je ne suis pas d'accord","e":"I disagree"},{"i":"d99c5","f":"je pense que","e":"I think"},{"i":"d99c6","f":"je trouve que","e":"I find"},{"i":"d99c7","f":"parce que","e":"because"},{"i":"d99c8","f":"par exemple","e":"for example"}]},{"d":100,"w":15,"c":[{"i":"d100c1","f":"moi aussi","e":"me too"},{"i":"d100c2","f":"moi non plus","e":"me neither"},{"i":"d100c3","f":"pas vraiment","e":"not really"},{"i":"d100c4","f":"au contraire","e":"on the contrary"},{"i":"d100c5","f":"je comprends, mais","e":"I understand, but"},{"i":"d100c6","f":"vous avez raison","e":"you are right"},{"i":"d100c7","f":"cela dépend","e":"it depends"},{"i":"d100c8","f":"pourtant","e":"however"}]},{"d":101,"w":15,"c":[{"i":"d101c1","f":"parce que","e":"because"},{"i":"d101c2","f":"car","e":"because"},{"i":"d101c3","f":"donc","e":"therefore"},{"i":"d101c4","f":"c'est pourquoi","e":"that is why"},{"i":"d101c5","f":"grâce à","e":"thanks to"},{"i":"d101c6","f":"à cause de","e":"because of"},{"i":"d101c7","f":"le résultat","e":"result"},{"i":"d101c8","f":"la raison","e":"reason"}]},{"d":102,"w":15,"c":[{"i":"d102c1","f":"un avantage","e":"advantage"},{"i":"d102c2","f":"un inconvénient","e":"disadvantage"},{"i":"d102c3","f":"d'un côté","e":"on one hand"},{"i":"d102c4","f":"de l'autre","e":"on the other"},{"i":"d102c5","f":"cependant","e":"however"},{"i":"d102c6","f":"pourtant","e":"yet"},{"i":"d102c7","f":"en plus","e":"additionally"},{"i":"d102c8","f":"en conclusion","e":"in conclusion"}]},{"d":103,"w":15,"c":[{"i":"d103c1","f":"je préfère","e":"I prefer"},{"i":"d103c2","f":"principalement parce que","e":"mainly because"},{"i":"d103c3","f":"par exemple","e":"for example"},{"i":"d103c4","f":"cela me permet de","e":"this allows me to"},{"i":"d103c5","f":"en général","e":"generally"},{"i":"d103c6","f":"en revanche","e":"on the other hand"},{"i":"d103c7","f":"finalement","e":"ultimately"},{"i":"d103c8","f":"mon choix","e":"my choice"}]},{"d":104,"w":15,"c":[{"i":"d104c1","f":"résumer","e":"summarize"},{"i":"d104c2","f":"décrire","e":"describe"},{"i":"d104c3","f":"raconter","e":"recount"},{"i":"d104c4","f":"expliquer","e":"explain"},{"i":"d104c5","f":"comparer","e":"compare"},{"i":"d104c6","f":"justifier","e":"justify"},{"i":"d104c7","f":"corriger","e":"correct"},{"i":"d104c8","f":"améliorer","e":"improve"}]},{"d":105,"w":15,"c":[{"i":"d105c1","f":"atteindre un niveau","e":"reach a level"},{"i":"d105c2","f":"progresser","e":"progress"},{"i":"d105c3","f":"une stratégie","e":"strategy"},{"i":"d105c4","f":"une priorité","e":"priority"},{"i":"d105c5","f":"régulièrement","e":"regularly"},{"i":"d105c6","f":"avec confiance","e":"confidently"},{"i":"d105c7","f":"encore","e":"still"},{"i":"d105c8","f":"désormais","e":"from now on"}]},{"d":106,"w":16,"c":[{"i":"d106c1","f":"j'étais","e":"I was"},{"i":"d106c2","f":"j'avais","e":"I had"},{"i":"d106c3","f":"je faisais","e":"I did"},{"i":"d106c4","f":"j'habitais","e":"I lived"},{"i":"d106c5","f":"nous allions","e":"we went"},{"i":"d106c6","f":"souvent","e":"often"},{"i":"d106c7","f":"à cette époque","e":"at that time"},{"i":"d106c8","f":"autrefois","e":"formerly"}]},{"d":107,"w":16,"c":[{"i":"d107c1","f":"tous les jours","e":"every day"},{"i":"d107c2","f":"chaque été","e":"every summer"},{"i":"d107c3","f":"d'habitude","e":"usually"},{"i":"d107c4","f":"toujours","e":"always"},{"i":"d107c5","f":"rarement","e":"rarely"},{"i":"d107c6","f":"avant","e":"before"},{"i":"d107c7","f":"maintenant","e":"now"},{"i":"d107c8","f":"ne...jamais","e":"never"}]},{"d":108,"w":16,"c":[{"i":"d108c1","f":"il faisait beau","e":"weather was nice"},{"i":"d108c2","f":"il était midi","e":"it was noon"},{"i":"d108c3","f":"la rue était calme","e":"street was quiet"},{"i":"d108c4","f":"je me sentais","e":"I felt"},{"i":"d108c5","f":"il y avait","e":"there was/were"},{"i":"d108c6","f":"autour de","e":"around"},{"i":"d108c7","f":"soudain","e":"suddenly"},{"i":"d108c8","f":"un souvenir","e":"memory"}]},{"d":109,"w":16,"c":[{"i":"d109c1","f":"pendant que","e":"while"},{"i":"d109c2","f":"quand","e":"when"},{"i":"d109c3","f":"tout à coup","e":"suddenly"},{"i":"d109c4","f":"soudain","e":"suddenly"},{"i":"d109c5","f":"au moment où","e":"at the moment when"},{"i":"d109c6","f":"se passer","e":"happen"},{"i":"d109c7","f":"interrompre","e":"interrupt"},{"i":"d109c8","f":"continuer","e":"continue"}]},{"d":110,"w":16,"c":[{"i":"d110c1","f":"un jour","e":"one day"},{"i":"d110c2","f":"pendant que","e":"while"},{"i":"d110c3","f":"soudain","e":"suddenly"},{"i":"d110c4","f":"avoir peur","e":"be afraid"},{"i":"d110c5","f":"se rendre compte","e":"realize"},{"i":"d110c6","f":"heureusement","e":"fortunately"},{"i":"d110c7","f":"finalement","e":"finally"},{"i":"d110c8","f":"raconter","e":"tell"}]},{"d":111,"w":16,"c":[{"i":"d111c1","f":"où habitais-tu ?","e":"where did you live?"},{"i":"d111c2","f":"comment était...?","e":"what was...like?"},{"i":"d111c3","f":"que faisais-tu ?","e":"what did you do?"},{"i":"d111c4","f":"ton école","e":"your school"},{"i":"d111c5","f":"tes vacances","e":"your holidays"},{"i":"d111c6","f":"ton jeu préféré","e":"favorite game"},{"i":"d111c7","f":"se souvenir de","e":"remember"},{"i":"d111c8","f":"manquer","e":"miss"}]},{"d":112,"w":16,"c":[{"i":"d112c1","f":"le contexte","e":"context"},{"i":"d112c2","f":"une action","e":"action"},{"i":"d112c3","f":"une habitude","e":"habit"},{"i":"d112c4","f":"un événement","e":"event"},{"i":"d112c5","f":"interrompre","e":"interrupt"},{"i":"d112c6","f":"se dérouler","e":"unfold"},{"i":"d112c7","f":"le dénouement","e":"outcome"},{"i":"d112c8","f":"pendant ce temps","e":"meanwhile"}]},{"d":113,"w":17,"c":[{"i":"d113c1","f":"un passeport","e":"passport"},{"i":"d113c2","f":"un permis","e":"permit"},{"i":"d113c3","f":"une preuve d'adresse","e":"proof of address"},{"i":"d113c4","f":"un justificatif","e":"supporting document"},{"i":"d113c5","f":"une date d'expiration","e":"expiry date"},{"i":"d113c6","f":"valide","e":"valid"},{"i":"d113c7","f":"renouveler","e":"renew"},{"i":"d113c8","f":"fournir","e":"provide"}]},{"d":114,"w":17,"c":[{"i":"d114c1","f":"un délai","e":"processing time"},{"i":"d114c2","f":"une date limite","e":"deadline"},{"i":"d114c3","f":"depuis deux semaines","e":"for two weeks"},{"i":"d114c4","f":"pendant trois jours","e":"for three days"},{"i":"d114c5","f":"il y a un mois","e":"one month ago"},{"i":"d114c6","f":"pour six mois","e":"for six months"},{"i":"d114c7","f":"avant le","e":"before"},{"i":"d114c8","f":"au plus tard","e":"no later than"}]},{"d":115,"w":17,"c":[{"i":"d115c1","f":"je voudrais savoir","e":"I would like to know"},{"i":"d115c2","f":"pourriez-vous préciser","e":"could you clarify"},{"i":"d115c3","f":"est-ce nécessaire ?","e":"is it necessary?"},{"i":"d115c4","f":"la procédure","e":"procedure"},{"i":"d115c5","f":"les conditions","e":"conditions"},{"i":"d115c6","f":"prendre combien de temps","e":"take how long"},{"i":"d115c7","f":"être admissible","e":"be eligible"},{"i":"d115c8","f":"contacter","e":"contact"}]},{"d":116,"w":17,"c":[{"i":"d116c1","f":"un retard","e":"delay"},{"i":"d116c2","f":"manquer un document","e":"be missing a document"},{"i":"d116c3","f":"en raison de","e":"due to"},{"i":"d116c4","f":"à cause de","e":"because of"},{"i":"d116c5","f":"par conséquent","e":"consequently"},{"i":"d116c6","f":"impossible","e":"impossible"},{"i":"d116c7","f":"prolonger","e":"extend"},{"i":"d116c8","f":"une solution temporaire","e":"temporary solution"}]},{"d":117,"w":17,"c":[{"i":"d117c1","f":"une étape","e":"step"},{"i":"d117c2","f":"joindre","e":"attach"},{"i":"d117c3","f":"envoyer","e":"submit/send"},{"i":"d117c4","f":"en fournir deux","e":"provide two of them"},{"i":"d117c5","f":"en avoir besoin","e":"need some"},{"i":"d117c6","f":"vérifier","e":"verify"},{"i":"d117c7","f":"conserver une copie","e":"keep a copy"},{"i":"d117c8","f":"recevoir une confirmation","e":"receive confirmation"}]},{"d":118,"w":17,"c":[{"i":"d118c1","f":"faire le suivi","e":"follow up"},{"i":"d118c2","f":"un numéro de dossier","e":"file number"},{"i":"d118c3","f":"traiter","e":"process"},{"i":"d118c4","f":"recevoir","e":"receive"},{"i":"d118c5","f":"vérifier le statut","e":"check status"},{"i":"d118c6","f":"en attente","e":"pending"},{"i":"d118c7","f":"transférer l'appel","e":"transfer call"},{"i":"d118c8","f":"rappeler","e":"call back"}]},{"d":119,"w":17,"c":[{"i":"d119c1","f":"une demande","e":"application/request"},{"i":"d119c2","f":"un dossier complet","e":"complete file"},{"i":"d119c3","f":"une exigence","e":"requirement"},{"i":"d119c4","f":"respecter un délai","e":"meet a deadline"},{"i":"d119c5","f":"obtenir une réponse","e":"get a response"},{"i":"d119c6","f":"faire parvenir","e":"forward/send"},{"i":"d119c7","f":"être en attente","e":"be pending"},{"i":"d119c8","f":"donner suite","e":"follow up"}]},{"d":120,"w":18,"c":[{"i":"d120c1","f":"fiable","e":"reliable"},{"i":"d120c2","f":"patient/patiente","e":"patient"},{"i":"d120c3","f":"généreux/généreuse","e":"generous"},{"i":"d120c4","f":"honnête","e":"honest"},{"i":"d120c5","f":"réservé","e":"reserved"},{"i":"d120c6","f":"sociable","e":"sociable"},{"i":"d120c7","f":"avoir confiance en","e":"trust"},{"i":"d120c8","f":"s'entendre avec","e":"get along with"}]},{"d":121,"w":18,"c":[{"i":"d121c1","f":"se sentir heureux","e":"feel happy"},{"i":"d121c2","f":"être inquiet","e":"be worried"},{"i":"d121c3","f":"être déçu","e":"be disappointed"},{"i":"d121c4","f":"être fier de","e":"be proud of"},{"i":"d121c5","f":"avoir peur de","e":"fear"},{"i":"d121c6","f":"rendre heureux","e":"make happy"},{"i":"d121c7","f":"être soulagé","e":"be relieved"},{"i":"d121c8","f":"réagir","e":"react"}]},{"d":122,"w":18,"c":[{"i":"d122c1","f":"tu devrais","e":"you should"},{"i":"d122c2","f":"à ta place","e":"in your position"},{"i":"d122c3","f":"pourquoi ne pas...?","e":"why not...?"},{"i":"d122c4","f":"essayer de","e":"try to"},{"i":"d122c5","f":"éviter de","e":"avoid"},{"i":"d122c6","f":"parler avec","e":"talk with"},{"i":"d122c7","f":"prendre du recul","e":"step back"},{"i":"d122c8","f":"demander de l'aide","e":"ask for help"}]},{"d":123,"w":18,"c":[{"i":"d123c1","f":"je suis désolé","e":"I am sorry"},{"i":"d123c2","f":"excuse-moi","e":"forgive me"},{"i":"d123c3","f":"je reconnais que","e":"I acknowledge that"},{"i":"d123c4","f":"ce n'était pas mon intention","e":"it was not my intention"},{"i":"d123c5","f":"j'aurais dû","e":"I should have"},{"i":"d123c6","f":"réparer","e":"make amends/repair"},{"i":"d123c7","f":"pardonner","e":"forgive"},{"i":"d123c8","f":"cela ne se reproduira plus","e":"it will not happen again"}]},{"d":124,"w":18,"c":[{"i":"d124c1","f":"recevoir des invités","e":"host guests"},{"i":"d124c2","f":"apporter quelque chose","e":"bring something"},{"i":"d124c3","f":"en acheter","e":"buy some"},{"i":"d124c4","f":"y aller","e":"go there"},{"i":"d124c5","f":"mettre la table","e":"set the table"},{"i":"d124c6","f":"accueillir","e":"welcome"},{"i":"d124c7","f":"servir","e":"serve"},{"i":"d124c8","f":"débarrasser","e":"clear table"}]},{"d":125,"w":18,"c":[{"i":"d125c1","f":"un désaccord","e":"disagreement"},{"i":"d125c2","f":"un malentendu","e":"misunderstanding"},{"i":"d125c3","f":"écouter","e":"listen"},{"i":"d125c4","f":"expliquer son point de vue","e":"explain viewpoint"},{"i":"d125c5","f":"même si","e":"even if"},{"i":"d125c6","f":"pourtant","e":"however"},{"i":"d125c7","f":"proposer un compromis","e":"propose compromise"},{"i":"d125c8","f":"se mettre d'accord","e":"agree"}]},{"d":126,"w":18,"c":[{"i":"d126c1","f":"faire confiance","e":"trust"},{"i":"d126c2","f":"soutenir","e":"support"},{"i":"d126c3","f":"se disputer","e":"argue"},{"i":"d126c4","f":"se réconcilier","e":"reconcile"},{"i":"d126c5","f":"comprendre","e":"understand"},{"i":"d126c6","f":"respecter","e":"respect"},{"i":"d126c7","f":"faire un effort","e":"make an effort"},{"i":"d126c8","f":"trouver un compromis","e":"find compromise"}]},{"d":127,"w":19,"c":[{"i":"d127c1","f":"un centre communautaire","e":"community centre"},{"i":"d127c2","f":"une garderie","e":"daycare"},{"i":"d127c3","f":"un espace vert","e":"green space"},{"i":"d127c4","f":"un organisme","e":"organization"},{"i":"d127c5","f":"un endroit où","e":"a place where"},{"i":"d127c6","f":"un service qui","e":"a service that"},{"i":"d127c7","f":"une activité que","e":"an activity that"},{"i":"d127c8","f":"accessible","e":"accessible"}]},{"d":128,"w":19,"c":[{"i":"d128c1","f":"trier","e":"sort"},{"i":"d128c2","f":"recycler","e":"recycle"},{"i":"d128c3","f":"une poubelle","e":"bin"},{"i":"d128c4","f":"les déchets","e":"waste"},{"i":"d128c5","f":"le compost","e":"compost"},{"i":"d128c6","f":"jeter","e":"throw away"},{"i":"d128c7","f":"réutiliser","e":"reuse"},{"i":"d128c8","f":"réduire","e":"reduce"}]},{"d":129,"w":19,"c":[{"i":"d129c1","f":"éteindre","e":"turn off"},{"i":"d129c2","f":"économiser","e":"save"},{"i":"d129c3","f":"gaspiller","e":"waste"},{"i":"d129c4","f":"une ampoule","e":"light bulb"},{"i":"d129c5","f":"baisser le chauffage","e":"lower heat"},{"i":"d129c6","f":"laisser couler","e":"leave running"},{"i":"d129c7","f":"consommer","e":"consume"},{"i":"d129c8","f":"une facture","e":"bill"}]},{"d":130,"w":19,"c":[{"i":"d130c1","f":"la pollution","e":"pollution"},{"i":"d130c2","f":"les transports en commun","e":"public transit"},{"i":"d130c3","f":"faire du covoiturage","e":"carpool"},{"i":"d130c4","f":"une piste cyclable","e":"bike lane"},{"i":"d130c5","f":"émettre","e":"emit"},{"i":"d130c6","f":"moins de voitures","e":"fewer cars"},{"i":"d130c7","f":"plus propre","e":"cleaner"},{"i":"d130c8","f":"améliorer","e":"improve"}]},{"d":131,"w":19,"c":[{"i":"d131c1","f":"une tempête","e":"storm"},{"i":"d131c2","f":"une inondation","e":"flood"},{"i":"d131c3","f":"une panne de courant","e":"power outage"},{"i":"d131c4","f":"une alerte","e":"warning"},{"i":"d131c5","f":"prévoir","e":"forecast"},{"i":"d131c6","f":"se préparer","e":"prepare"},{"i":"d131c7","f":"éviter de sortir","e":"avoid going out"},{"i":"d131c8","f":"être prudent","e":"be careful"}]},{"d":132,"w":19,"c":[{"i":"d132c1","f":"on pourrait","e":"we could"},{"i":"d132c2","f":"il serait utile de","e":"it would be useful to"},{"i":"d132c3","f":"cela permettrait de","e":"that would allow"},{"i":"d132c4","f":"proposer","e":"propose"},{"i":"d132c5","f":"installer","e":"install"},{"i":"d132c6","f":"améliorer","e":"improve"},{"i":"d132c7","f":"participer","e":"participate"},{"i":"d132c8","f":"un sondage","e":"survey"}]},{"d":133,"w":19,"c":[{"i":"d133c1","f":"sensibiliser","e":"raise awareness"},{"i":"d133c2","f":"protéger","e":"protect"},{"i":"d133c3","f":"participer","e":"participate"},{"i":"d133c4","f":"une initiative","e":"initiative"},{"i":"d133c5","f":"durable","e":"sustainable"},{"i":"d133c6","f":"collectif","e":"collective"},{"i":"d133c7","f":"avoir un impact","e":"have an impact"},{"i":"d133c8","f":"mettre en place","e":"implement"}]},{"d":134,"w":20,"c":[{"i":"d134c1","f":"au début","e":"at first"},{"i":"d134c2","f":"pendant que","e":"while"},{"i":"d134c3","f":"tout à coup","e":"suddenly"},{"i":"d134c4","f":"à ce moment-là","e":"at that moment"},{"i":"d134c5","f":"ensuite","e":"next"},{"i":"d134c6","f":"malgré cela","e":"despite that"},{"i":"d134c7","f":"finalement","e":"finally"},{"i":"d134c8","f":"depuis ce jour","e":"since that day"}]},{"d":135,"w":20,"c":[{"i":"d135c1","f":"tout d'abord","e":"first of all"},{"i":"d135c2","f":"il faut d'abord","e":"first you must"},{"i":"d135c3","f":"ensuite","e":"next"},{"i":"d135c4","f":"une fois que","e":"once"},{"i":"d135c5","f":"vérifier que","e":"check that"},{"i":"d135c6","f":"en cas de","e":"in case of"},{"i":"d135c7","f":"terminer par","e":"finish with"},{"i":"d135c8","f":"le résultat attendu","e":"expected result"}]},{"d":136,"w":20,"c":[{"i":"d136c1","f":"le plus adapté","e":"most suitable"},{"i":"d136c2","f":"le moins coûteux","e":"least expensive"},{"i":"d136c3","f":"en comparaison","e":"in comparison"},{"i":"d136c4","f":"tandis que","e":"whereas"},{"i":"d136c5","f":"répondre aux besoins","e":"meet needs"},{"i":"d136c6","f":"je recommande","e":"I recommend"},{"i":"d136c7","f":"le principal avantage","e":"main advantage"},{"i":"d136c8","f":"en conclusion","e":"in conclusion"}]},{"d":137,"w":20,"c":[{"i":"d137c1","f":"identifier la cause","e":"identify cause"},{"i":"d137c2","f":"avoir pour conséquence","e":"result in"},{"i":"d137c3","f":"une option possible","e":"possible option"},{"i":"d137c4","f":"il vaudrait mieux","e":"it would be better"},{"i":"d137c5","f":"mettre en œuvre","e":"implement"},{"i":"d137c6","f":"éviter que","e":"prevent"},{"i":"d137c7","f":"évaluer","e":"evaluate"},{"i":"d137c8","f":"efficace","e":"effective"}]},{"d":138,"w":20,"c":[{"i":"d138c1","f":"pour commencer","e":"to begin"},{"i":"d138c2","f":"en ce qui concerne","e":"regarding"},{"i":"d138c3","f":"ce qui est important","e":"what is important"},{"i":"d138c4","f":"par exemple","e":"for example"},{"i":"d138c5","f":"en revanche","e":"on the other hand"},{"i":"d138c6","f":"selon mon expérience","e":"in my experience"},{"i":"d138c7","f":"je conseillerais","e":"I would advise"},{"i":"d138c8","f":"pour conclure","e":"to conclude"}]},{"d":139,"w":20,"c":[{"i":"d139c1","f":"une introduction","e":"introduction"},{"i":"d139c2","f":"développer","e":"develop"},{"i":"d139c3","f":"un paragraphe","e":"paragraph"},{"i":"d139c4","f":"un exemple précis","e":"specific example"},{"i":"d139c5","f":"relier les idées","e":"connect ideas"},{"i":"d139c6","f":"reformuler","e":"rephrase"},{"i":"d139c7","f":"vérifier","e":"check"},{"i":"d139c8","f":"une conclusion","e":"conclusion"}]},{"d":140,"w":20,"c":[{"i":"d140c1","f":"maîtriser","e":"master"},{"i":"d140c2","f":"consolider","e":"consolidate"},{"i":"d140c3","f":"une lacune","e":"gap"},{"i":"d140c4","f":"être capable de","e":"be able to"},{"i":"d140c5","f":"spontanément","e":"spontaneously"},{"i":"d140c6","f":"avec précision","e":"accurately"},{"i":"d140c7","f":"un progrès mesurable","e":"measurable progress"},{"i":"d140c8","f":"viser","e":"aim for"}]},{"d":141,"w":21,"c":[{"i":"d141c1","f":"selon moi","e":"in my view"},{"i":"d141c2","f":"je considère que","e":"I consider that"},{"i":"d141c3","f":"il me semble que","e":"it seems to me"},{"i":"d141c4","f":"la raison principale","e":"main reason"},{"i":"d141c5","f":"en effet","e":"indeed"},{"i":"d141c6","f":"par exemple","e":"for example"},{"i":"d141c7","f":"cependant","e":"however"},{"i":"d141c8","f":"pour conclure","e":"to conclude"}]},{"d":142,"w":21,"c":[{"i":"d142c1","f":"plutôt","e":"rather"},{"i":"d142c2","f":"assez","e":"fairly"},{"i":"d142c3","f":"particulièrement","e":"particularly"},{"i":"d142c4","f":"dans une certaine mesure","e":"to some extent"},{"i":"d142c5","f":"pas forcément","e":"not necessarily"},{"i":"d142c6","f":"surtout","e":"especially"},{"i":"d142c7","f":"seulement","e":"only"},{"i":"d142c8","f":"en partie","e":"partly"}]},{"d":143,"w":21,"c":[{"i":"d143c1","f":"notamment","e":"notably"},{"i":"d143c2","f":"comme","e":"such as"},{"i":"d143c3","f":"prenons l'exemple de","e":"take the example of"},{"i":"d143c4","f":"cela montre que","e":"this shows that"},{"i":"d143c5","f":"un cas concret","e":"concrete case"},{"i":"d143c6","f":"illustrer","e":"illustrate"},{"i":"d143c7","f":"prouver","e":"demonstrate"},{"i":"d143c8","f":"pertinent","e":"relevant"}]},{"d":144,"w":21,"c":[{"i":"d144c1","f":"je reconnais que","e":"I acknowledge"},{"i":"d144c2","f":"vous avez raison sur ce point","e":"you are right on this point"},{"i":"d144c3","f":"néanmoins","e":"nevertheless"},{"i":"d144c4","f":"malgré cela","e":"despite that"},{"i":"d144c5","f":"même si","e":"even if"},{"i":"d144c6","f":"je reste convaincu que","e":"I remain convinced"},{"i":"d144c7","f":"une réserve","e":"reservation"},{"i":"d144c8","f":"concéder","e":"concede"}]},{"d":145,"w":21,"c":[{"i":"d145c1","f":"un point de vue","e":"viewpoint"},{"i":"d145c2","f":"être favorable à","e":"support"},{"i":"d145c3","f":"être opposé à","e":"oppose"},{"i":"d145c4","f":"tandis que","e":"whereas"},{"i":"d145c5","f":"en revanche","e":"on the other hand"},{"i":"d145c6","f":"avoir en commun","e":"have in common"},{"i":"d145c7","f":"différer","e":"differ"},{"i":"d145c8","f":"un compromis","e":"compromise"}]},{"d":146,"w":21,"c":[{"i":"d146c1","f":"prendre la parole","e":"take the floor"},{"i":"d146c2","f":"répondre à un argument","e":"respond to an argument"},{"i":"d146c3","f":"je voudrais ajouter","e":"I would add"},{"i":"d146c4","f":"je ne partage pas cet avis","e":"I do not share that view"},{"i":"d146c5","f":"permettez-moi de préciser","e":"let me clarify"},{"i":"d146c6","f":"un contre-argument","e":"counterargument"},{"i":"d146c7","f":"convaincre","e":"persuade"},{"i":"d146c8","f":"résumer","e":"summarize"}]},{"d":147,"w":21,"c":[{"i":"d147c1","f":"défendre une idée","e":"defend an idea"},{"i":"d147c2","f":"justifier","e":"justify"},{"i":"d147c3","f":"reconnaître","e":"acknowledge"},{"i":"d147c4","f":"nuancer","e":"qualify"},{"i":"d147c5","f":"contester","e":"challenge"},{"i":"d147c6","f":"résumer","e":"summarize"},{"i":"d147c7","f":"cohérent","e":"coherent"},{"i":"d147c8","f":"convaincant","e":"convincing"}]},{"d":148,"w":22,"c":[{"i":"d148c1","f":"un poste","e":"position"},{"i":"d148c2","f":"une responsabilité","e":"responsibility"},{"i":"d148c3","f":"une équipe","e":"team"},{"i":"d148c4","f":"collaborer","e":"collaborate"},{"i":"d148c5","f":"superviser","e":"supervise"},{"i":"d148c6","f":"être chargé de","e":"be responsible for"},{"i":"d148c7","f":"depuis","e":"since/for"},{"i":"d148c8","f":"atteindre un objectif","e":"achieve a goal"}]},{"d":149,"w":22,"c":[{"i":"d149c1","f":"l'ordre du jour","e":"agenda"},{"i":"d149c2","f":"aborder un point","e":"address a point"},{"i":"d149c3","f":"prendre une décision","e":"make a decision"},{"i":"d149c4","f":"être d'accord sur","e":"agree on"},{"i":"d149c5","f":"il faut que","e":"it is necessary that"},{"i":"d149c6","f":"une action à suivre","e":"action item"},{"i":"d149c7","f":"fixer une échéance","e":"set a deadline"},{"i":"d149c8","f":"rédiger un compte rendu","e":"write minutes"}]},{"d":150,"w":22,"c":[{"i":"d150c1","f":"urgent","e":"urgent"},{"i":"d150c2","f":"important","e":"important"},{"i":"d150c3","f":"une priorité","e":"priority"},{"i":"d150c4","f":"une charge de travail","e":"workload"},{"i":"d150c5","f":"reporter","e":"postpone"},{"i":"d150c6","f":"déléguer","e":"delegate"},{"i":"d150c7","f":"respecter l'échéance","e":"meet deadline"},{"i":"d150c8","f":"gérer son temps","e":"manage time"}]},{"d":151,"w":22,"c":[{"i":"d151c1","f":"un progrès","e":"progress"},{"i":"d151c2","f":"un obstacle","e":"blocker"},{"i":"d151c3","f":"dépendre de","e":"depend on"},{"i":"d151c4","f":"être bloqué par","e":"be blocked by"},{"i":"d151c5","f":"résoudre","e":"resolve"},{"i":"d151c6","f":"en cours","e":"in progress"},{"i":"d151c7","f":"d'ici vendredi","e":"by Friday"},{"i":"d151c8","f":"la prochaine étape","e":"next step"}]},{"d":152,"w":22,"c":[{"i":"d152c1","f":"je recommanderais","e":"I would recommend"},{"i":"d152c2","f":"nous pourrions","e":"we could"},{"i":"d152c3","f":"il faudrait","e":"it would be necessary"},{"i":"d152c4","f":"l'option la plus adaptée","e":"most suitable option"},{"i":"d152c5","f":"selon les critères","e":"according to criteria"},{"i":"d152c6","f":"un risque","e":"risk"},{"i":"d152c7","f":"un bénéfice","e":"benefit"},{"i":"d152c8","f":"mettre en œuvre","e":"implement"}]},{"d":153,"w":22,"c":[{"i":"d153c1","f":"faire suite à","e":"follow up on"},{"i":"d153c2","f":"comme convenu","e":"as agreed"},{"i":"d153c3","f":"veuillez trouver ci-joint","e":"please find attached"},{"i":"d153c4","f":"pourriez-vous confirmer","e":"could you confirm"},{"i":"d153c5","f":"rester à disposition","e":"remain available"},{"i":"d153c6","f":"dans l'attente de","e":"awaiting"},{"i":"d153c7","f":"cordialement","e":"kind regards"},{"i":"d153c8","f":"objet clair","e":"clear subject"}]},{"d":154,"w":22,"c":[{"i":"d154c1","f":"un livrable","e":"deliverable"},{"i":"d154c2","f":"une échéance","e":"deadline"},{"i":"d154c3","f":"une décision","e":"decision"},{"i":"d154c4","f":"un responsable","e":"owner/person responsible"},{"i":"d154c5","f":"assurer le suivi","e":"follow up"},{"i":"d154c6","f":"signaler un risque","e":"flag a risk"},{"i":"d154c7","f":"prioriser","e":"prioritize"},{"i":"d154c8","f":"valider","e":"approve/validate"}]},{"d":155,"w":23,"c":[{"i":"d155c1","f":"un titre","e":"headline"},{"i":"d155c2","f":"un fait","e":"fact"},{"i":"d155c3","f":"un événement","e":"event"},{"i":"d155c4","f":"avoir lieu","e":"take place"},{"i":"d155c5","f":"être annoncé","e":"be announced"},{"i":"d155c6","f":"être organisé","e":"be organized"},{"i":"d155c7","f":"selon les autorités","e":"according to authorities"},{"i":"d155c8","f":"un témoin","e":"witness"}]},{"d":156,"w":23,"c":[{"i":"d156c1","f":"d'après","e":"according to"},{"i":"d156c2","f":"l'article indique que","e":"article states that"},{"i":"d156c3","f":"l'auteur explique que","e":"author explains"},{"i":"d156c4","f":"l'idée principale","e":"main idea"},{"i":"d156c5","f":"un détail essentiel","e":"essential detail"},{"i":"d156c6","f":"en résumé","e":"in summary"},{"i":"d156c7","f":"sans ajouter","e":"without adding"},{"i":"d156c8","f":"reformuler","e":"rephrase"}]},{"d":157,"w":23,"c":[{"i":"d157c1","f":"un fait vérifiable","e":"verifiable fact"},{"i":"d157c2","f":"une opinion","e":"opinion"},{"i":"d157c3","f":"certain","e":"certain"},{"i":"d157c4","f":"probable","e":"probable"},{"i":"d157c5","f":"il paraît que","e":"apparently"},{"i":"d157c6","f":"il est possible que","e":"it is possible that"},{"i":"d157c7","f":"confirmer","e":"confirm"},{"i":"d157c8","f":"une preuve","e":"evidence"}]},{"d":158,"w":23,"c":[{"i":"d158c1","f":"une cause profonde","e":"root cause"},{"i":"d158c2","f":"être dû à","e":"be due to"},{"i":"d158c3","f":"entraîner","e":"lead to"},{"i":"d158c4","f":"avoir un impact sur","e":"impact"},{"i":"d158c5","f":"en raison de","e":"due to"},{"i":"d158c6","f":"puisque","e":"since/because"},{"i":"d158c7","f":"par conséquent","e":"consequently"},{"i":"d158c8","f":"à long terme","e":"long term"}]},{"d":159,"w":23,"c":[{"i":"d159c1","f":"la majorité","e":"majority"},{"i":"d159c2","f":"une minorité","e":"minority"},{"i":"d159c3","f":"la moitié","e":"half"},{"i":"d159c4","f":"un tiers","e":"one third"},{"i":"d159c5","f":"augmenter de","e":"increase by"},{"i":"d159c6","f":"diminuer de","e":"decrease by"},{"i":"d159c7","f":"rester stable","e":"remain stable"},{"i":"d159c8","f":"par rapport à","e":"compared with"}]},{"d":160,"w":23,"c":[{"i":"d160c1","f":"cette nouvelle me surprend","e":"this news surprises me"},{"i":"d160c2","f":"c'est préoccupant","e":"it is worrying"},{"i":"d160c3","f":"je me réjouis de","e":"I am pleased about"},{"i":"d160c4","f":"selon moi","e":"in my view"},{"i":"d160c5","f":"il faudrait","e":"it would be necessary"},{"i":"d160c6","f":"il est probable que","e":"it is likely that"},{"i":"d160c7","f":"à condition de","e":"provided that"},{"i":"d160c8","f":"suivre l'évolution","e":"monitor developments"}]},{"d":161,"w":23,"c":[{"i":"d161c1","f":"une source fiable","e":"reliable source"},{"i":"d161c2","f":"recouper","e":"cross-check"},{"i":"d161c3","f":"citer","e":"cite"},{"i":"d161c4","f":"vérifier","e":"verify"},{"i":"d161c5","f":"une affirmation","e":"claim"},{"i":"d161c6","f":"une donnée","e":"data point"},{"i":"d161c7","f":"objectif","e":"objective"},{"i":"d161c8","f":"biaisé","e":"biased"}]},{"d":162,"w":24,"c":[{"i":"d162c1","f":"une contrainte","e":"constraint"},{"i":"d162c2","f":"un budget","e":"budget"},{"i":"d162c3","f":"une étape","e":"stop/step"},{"i":"d162c4","f":"lorsque","e":"when"},{"i":"d162c5","f":"dès que","e":"as soon as"},{"i":"d162c6","f":"prévoir du temps","e":"allow time"},{"i":"d162c7","f":"être flexible","e":"be flexible"},{"i":"d162c8","f":"respecter l'horaire","e":"keep schedule"}]},{"d":163,"w":24,"c":[{"i":"d163c1","f":"un vol annulé","e":"cancelled flight"},{"i":"d163c2","f":"un retard important","e":"major delay"},{"i":"d163c3","f":"une correspondance manquée","e":"missed connection"},{"i":"d163c4","f":"être réacheminé","e":"be rerouted"},{"i":"d163c5","f":"une indemnisation","e":"compensation"},{"i":"d163c6","f":"prendre en charge","e":"cover/provide"},{"i":"d163c7","f":"une solution de remplacement","e":"alternative"},{"i":"d163c8","f":"déposer une réclamation","e":"file complaint"}]},{"d":164,"w":24,"c":[{"i":"d164c1","f":"égarer","e":"misplace"},{"i":"d164c2","f":"signaler la perte","e":"report loss"},{"i":"d164c3","f":"les objets trouvés","e":"lost and found"},{"i":"d164c4","f":"une description précise","e":"precise description"},{"i":"d164c5","f":"j'avais laissé","e":"I had left"},{"i":"d164c6","f":"avant de","e":"before"},{"i":"d164c7","f":"retrouver","e":"recover/find"},{"i":"d164c8","f":"une déclaration","e":"report/form"}]},{"d":165,"w":24,"c":[{"i":"d165c1","f":"ne pas correspondre à","e":"not match"},{"i":"d165c2","f":"contrairement à","e":"contrary to"},{"i":"d165c3","f":"le service annoncé","e":"advertised service"},{"i":"d165c4","f":"une nuisance","e":"disturbance"},{"i":"d165c5","f":"signaler à plusieurs reprises","e":"report repeatedly"},{"i":"d165c6","f":"demander un geste commercial","e":"request compensation/goodwill"},{"i":"d165c7","f":"insatisfait","e":"dissatisfied"},{"i":"d165c8","f":"résoudre rapidement","e":"resolve quickly"}]},{"d":166,"w":24,"c":[{"i":"d166c1","f":"une destination incontournable","e":"must-see destination"},{"i":"d166c2","f":"convenir à","e":"suit"},{"i":"d166c3","f":"être réputé pour","e":"be known for"},{"i":"d166c4","f":"ce qui me plaît","e":"what I like"},{"i":"d166c5","f":"le meilleur moment","e":"best time"},{"i":"d166c6","f":"éviter la foule","e":"avoid crowds"},{"i":"d166c7","f":"réserver à l'avance","e":"book ahead"},{"i":"d166c8","f":"rapport qualité-prix","e":"value for money"}]},{"d":167,"w":24,"c":[{"i":"d167c1","f":"un voyage marquant","e":"memorable trip"},{"i":"d167c2","f":"avant de partir","e":"before leaving"},{"i":"d167c3","f":"j'avais prévu","e":"I had planned"},{"i":"d167c4","f":"pendant le séjour","e":"during the stay"},{"i":"d167c5","f":"faire face à","e":"face/deal with"},{"i":"d167c6","f":"s'adapter","e":"adapt"},{"i":"d167c7","f":"tirer une leçon","e":"learn a lesson"},{"i":"d167c8","f":"avec le recul","e":"in hindsight"}]},{"d":168,"w":24,"c":[{"i":"d168c1","f":"faire face à","e":"face"},{"i":"d168c2","f":"réclamer","e":"claim/complain"},{"i":"d168c3","f":"négocier","e":"negotiate"},{"i":"d168c4","f":"s'adapter","e":"adapt"},{"i":"d168c5","f":"résoudre","e":"solve"},{"i":"d168c6","f":"recommander","e":"recommend"},{"i":"d168c7","f":"une leçon apprise","e":"lesson learned"},{"i":"d168c8","f":"un imprévu","e":"unexpected event"}]},{"d":169,"w":25,"c":[{"i":"d169c1","f":"la thèse","e":"thesis"},{"i":"d169c2","f":"un argument","e":"argument"},{"i":"d169c3","f":"un exemple","e":"example"},{"i":"d169c4","f":"une objection","e":"objection"},{"i":"d169c5","f":"réfuter","e":"rebut"},{"i":"d169c6","f":"un paragraphe","e":"paragraph"},{"i":"d169c7","f":"le but de l'auteur","e":"author's purpose"},{"i":"d169c8","f":"le ton","e":"tone"}]},{"d":170,"w":25,"c":[{"i":"d170c1","f":"l'intervenant","e":"speaker"},{"i":"d170c2","f":"affirmer que","e":"state that"},{"i":"d170c3","f":"expliquer que","e":"explain that"},{"i":"d170c4","f":"ajouter que","e":"add that"},{"i":"d170c5","f":"être favorable","e":"be in favor"},{"i":"d170c6","f":"exprimer une réserve","e":"express reservation"},{"i":"d170c7","f":"insister sur","e":"emphasize"},{"i":"d170c8","f":"conclure que","e":"conclude that"}]},{"d":171,"w":25,"c":[{"i":"d171c1","f":"j'aborderai trois points","e":"I will address three points"},{"i":"d171c2","f":"tout d'abord","e":"first"},{"i":"d171c3","f":"en ce qui concerne","e":"regarding"},{"i":"d171c4","f":"prenons un exemple","e":"take an example"},{"i":"d171c5","f":"je voudrais préciser","e":"I would clarify"},{"i":"d171c6","f":"malgré cet avantage","e":"despite this advantage"},{"i":"d171c7","f":"l'essentiel est","e":"key point is"},{"i":"d171c8","f":"pour conclure","e":"to conclude"}]},{"d":172,"w":25,"c":[{"i":"d172c1","f":"si je comprends bien","e":"if I understand correctly"},{"i":"d172c2","f":"ma priorité est","e":"my priority is"},{"i":"d172c3","f":"quelles options avons-nous ?","e":"what options do we have?"},{"i":"d172c4","f":"cela pourrait fonctionner","e":"that could work"},{"i":"d172c5","f":"je préférerais","e":"I would prefer"},{"i":"d172c6","f":"à condition que","e":"provided that"},{"i":"d172c7","f":"nous sommes d'accord","e":"we agree"},{"i":"d172c8","f":"récapitulons","e":"let's recap"}]},{"d":173,"w":25,"c":[{"i":"d173c1","f":"je souhaite attirer votre attention","e":"I wish to draw attention"},{"i":"d173c2","f":"la situation suivante","e":"following situation"},{"i":"d173c3","f":"malgré mes démarches","e":"despite my efforts"},{"i":"d173c4","f":"je vous prie de","e":"I ask you to"},{"i":"d173c5","f":"dans les meilleurs délais","e":"as soon as possible"},{"i":"d173c6","f":"une réponse écrite","e":"written reply"},{"i":"d173c7","f":"faute de quoi","e":"failing which"},{"i":"d173c8","f":"veuillez agréer","e":"formal closing formula"}]},{"d":174,"w":25,"c":[{"i":"d174c1","f":"gérer son temps","e":"manage time"},{"i":"d174c2","f":"respecter la consigne","e":"follow instructions"},{"i":"d174c3","f":"repérer les mots-clés","e":"identify keywords"},{"i":"d174c4","f":"prendre des notes","e":"take notes"},{"i":"d174c5","f":"structurer","e":"structure"},{"i":"d174c6","f":"développer","e":"develop"},{"i":"d174c7","f":"se corriger","e":"self-correct"},{"i":"d174c8","f":"évaluer","e":"assess"}]},{"d":175,"w":25,"c":[{"i":"d175c1","f":"un niveau intermédiaire","e":"intermediate level"},{"i":"d175c2","f":"atteindre","e":"reach"},{"i":"d175c3","f":"maintenir","e":"maintain"},{"i":"d175c4","f":"une faiblesse récurrente","e":"recurring weakness"},{"i":"d175c5","f":"un objectif précis","e":"precise goal"},{"i":"d175c6","f":"mesurer","e":"measure"},{"i":"d175c7","f":"progresser de manière régulière","e":"progress steadily"},{"i":"d175c8","f":"la prochaine phase","e":"next phase"}]},{"d":176,"w":26,"c":[{"i":"d176c1","f":"une thèse","e":"thesis"},{"i":"d176c2","f":"soutenir que","e":"argue that"},{"i":"d176c3","f":"ce qui compte","e":"what matters"},{"i":"d176c4","f":"ce que je propose","e":"what I propose"},{"i":"d176c5","f":"un enjeu","e":"issue/stake"},{"i":"d176c6","f":"une position claire","e":"clear position"},{"i":"d176c7","f":"annoncer son plan","e":"outline plan"},{"i":"d176c8","f":"démontrer","e":"demonstrate"}]},{"d":177,"w":26,"c":[{"i":"d177c1","f":"une preuve","e":"evidence"},{"i":"d177c2","f":"une donnée","e":"data point"},{"i":"d177c3","f":"un exemple concret","e":"concrete example"},{"i":"d177c4","f":"permettre de","e":"enable"},{"i":"d177c5","f":"contribuer à","e":"contribute to"},{"i":"d177c6","f":"renforcer","e":"strengthen"},{"i":"d177c7","f":"montrer que","e":"show that"},{"i":"d177c8","f":"être pertinent","e":"be relevant"}]},{"d":178,"w":26,"c":[{"i":"d178c1","f":"un contre-argument","e":"counterargument"},{"i":"d178c2","f":"certes","e":"admittedly"},{"i":"d178c3","f":"toutefois","e":"however"},{"i":"d178c4","f":"être valable","e":"be valid"},{"i":"d178c5","f":"ne pas tenir compte de","e":"fail to consider"},{"i":"d178c6","f":"répondre à","e":"respond to"},{"i":"d178c7","f":"réfuter","e":"rebut"},{"i":"d178c8","f":"l'emporter sur","e":"outweigh"}]},{"d":179,"w":26,"c":[{"i":"d179c1","f":"celui-ci","e":"this one"},{"i":"d179c2","f":"celle-ci","e":"this one"},{"i":"d179c3","f":"ceux-ci","e":"these ones"},{"i":"d179c4","f":"y contribuer","e":"contribute to it"},{"i":"d179c5","f":"en parler","e":"talk about it"},{"i":"d179c6","f":"cette mesure","e":"this measure"},{"i":"d179c7","f":"le premier point","e":"first point"},{"i":"d179c8","f":"quant à","e":"as for"}]},{"d":180,"w":26,"c":[{"i":"d180c1","f":"il serait souhaitable de","e":"it would be desirable to"},{"i":"d180c2","f":"il faudrait","e":"it would be necessary"},{"i":"d180c3","f":"je recommande vivement","e":"strongly recommend"},{"i":"d180c4","f":"une mesure prioritaire","e":"priority measure"},{"i":"d180c5","f":"réalisable","e":"feasible"},{"i":"d180c6","f":"rentable","e":"cost-effective"},{"i":"d180c7","f":"convaincre","e":"persuade"},{"i":"d180c8","f":"passer à l'action","e":"take action"}]},{"d":181,"w":26,"c":[{"i":"d181c1","f":"une erreur d'accord","e":"agreement error"},{"i":"d181c2","f":"la concordance des temps","e":"tense consistency"},{"i":"d181c3","f":"une répétition","e":"repetition"},{"i":"d181c4","f":"une phrase incomplète","e":"fragment"},{"i":"d181c5","f":"reformuler","e":"rephrase"},{"i":"d181c6","f":"supprimer","e":"delete"},{"i":"d181c7","f":"préciser","e":"clarify"},{"i":"d181c8","f":"relire à voix haute","e":"read aloud"}]},{"d":182,"w":26,"c":[{"i":"d182c1","f":"argumenter","e":"argue"},{"i":"d182c2","f":"appuyer","e":"support"},{"i":"d182c3","f":"concéder","e":"concede"},{"i":"d182c4","f":"réfuter","e":"rebut"},{"i":"d182c5","f":"enchaîner","e":"link"},{"i":"d182c6","f":"persuader","e":"persuade"},{"i":"d182c7","f":"une conclusion logique","e":"logical conclusion"},{"i":"d182c8","f":"un appel à l'action","e":"call to action"}]},{"d":183,"w":27,"c":[{"i":"d183c1","f":"un besoin","e":"need"},{"i":"d183c2","f":"un objectif","e":"objective"},{"i":"d183c3","f":"une difficulté","e":"challenge"},{"i":"d183c4","f":"une contrainte","e":"constraint"},{"i":"d183c5","f":"actuellement","e":"currently"},{"i":"d183c6","f":"qu'entendez-vous par...?","e":"what do you mean by...?"},{"i":"d183c7","f":"si je comprends bien","e":"if I understand"},{"i":"d183c8","f":"reformuler","e":"rephrase"}]},{"d":184,"w":27,"c":[{"i":"d184c1","f":"une fonctionnalité","e":"feature"},{"i":"d184c2","f":"automatiser","e":"automate"},{"i":"d184c3","f":"s'intégrer à","e":"integrate with"},{"i":"d184c4","f":"permettre de","e":"allow"},{"i":"d184c5","f":"réduire","e":"reduce"},{"i":"d184c6","f":"améliorer","e":"improve"},{"i":"d184c7","f":"un utilisateur","e":"user"},{"i":"d184c8","f":"un résultat attendu","e":"expected result"}]},{"d":185,"w":27,"c":[{"i":"d185c1","f":"un gain de temps","e":"time saving"},{"i":"d185c2","f":"une baisse de","e":"decrease of"},{"i":"d185c3","f":"une hausse de","e":"increase of"},{"i":"d185c4","f":"économiser","e":"save"},{"i":"d185c5","f":"réduire de moitié","e":"cut in half"},{"i":"d185c6","f":"selon nos estimations","e":"by our estimates"},{"i":"d185c7","f":"à condition de","e":"provided that"},{"i":"d185c8","f":"mesurer","e":"measure"}]},{"d":186,"w":27,"c":[{"i":"d186c1","f":"une préoccupation","e":"concern"},{"i":"d186c2","f":"je comprends votre inquiétude","e":"I understand your concern"},{"i":"d186c3","f":"préciser","e":"clarify"},{"i":"d186c4","f":"cela dépend de","e":"that depends on"},{"i":"d186c5","f":"réduire le risque","e":"reduce risk"},{"i":"d186c6","f":"commencer par un pilote","e":"start with a pilot"},{"i":"d186c7","f":"rassurer","e":"reassure"},{"i":"d186c8","f":"répondre à vos attentes","e":"meet expectations"}]},{"d":187,"w":27,"c":[{"i":"d187c1","f":"un pilote","e":"pilot"},{"i":"d187c2","f":"le périmètre","e":"scope"},{"i":"d187c3","f":"une partie prenante","e":"stakeholder"},{"i":"d187c4","f":"un critère de réussite","e":"success criterion"},{"i":"d187c5","f":"une étape","e":"milestone"},{"i":"d187c6","f":"être responsable de","e":"own/be responsible"},{"i":"d187c7","f":"recueillir des retours","e":"gather feedback"},{"i":"d187c8","f":"décider de la suite","e":"decide next steps"}]},{"d":188,"w":27,"c":[{"i":"d188c1","f":"il a été convenu que","e":"it was agreed that"},{"i":"d188c2","f":"le client a confirmé que","e":"client confirmed"},{"i":"d188c3","f":"nous avons proposé de","e":"we proposed"},{"i":"d188c4","f":"une action","e":"action item"},{"i":"d188c5","f":"un responsable","e":"owner"},{"i":"d188c6","f":"une échéance","e":"deadline"},{"i":"d188c7","f":"un point ouvert","e":"open item"},{"i":"d188c8","f":"la prochaine réunion","e":"next meeting"}]},{"d":189,"w":27,"c":[{"i":"d189c1","f":"écouter activement","e":"listen actively"},{"i":"d189c2","f":"clarifier","e":"clarify"},{"i":"d189c3","f":"démontrer la valeur","e":"demonstrate value"},{"i":"d189c4","f":"répondre à une objection","e":"handle objection"},{"i":"d189c5","f":"réduire le risque","e":"reduce risk"},{"i":"d189c6","f":"convenir de","e":"agree on"},{"i":"d189c7","f":"documenter","e":"document"},{"i":"d189c8","f":"assurer le suivi","e":"follow up"}]},{"d":190,"w":28,"c":[{"i":"d190c1","f":"être tenu de","e":"be required to"},{"i":"d190c2","f":"avoir le droit de","e":"have the right to"},{"i":"d190c3","f":"être autorisé à","e":"be allowed to"},{"i":"d190c4","f":"être interdit de","e":"be prohibited"},{"i":"d190c5","f":"respecter","e":"comply with"},{"i":"d190c6","f":"une obligation","e":"obligation"},{"i":"d190c7","f":"une exception","e":"exception"},{"i":"d190c8","f":"s'appliquer à","e":"apply to"}]},{"d":191,"w":28,"c":[{"i":"d191c1","f":"un avis","e":"notice"},{"i":"d191c2","f":"être informé de","e":"be informed of"},{"i":"d191c3","f":"entrer en vigueur","e":"take effect"},{"i":"d191c4","f":"être concerné par","e":"be affected by"},{"i":"d191c5","f":"une modification","e":"change"},{"i":"d191c6","f":"une consultation","e":"consultation"},{"i":"d191c7","f":"soumettre un commentaire","e":"submit comment"},{"i":"d191c8","f":"avant la date limite","e":"before deadline"}]},{"d":192,"w":28,"c":[{"i":"d192c1","f":"contester","e":"dispute/challenge"},{"i":"d192c2","f":"un frais","e":"fee"},{"i":"d192c3","f":"être facturé","e":"be charged"},{"i":"d192c4","f":"injustifié","e":"unjustified"},{"i":"d192c5","f":"fournir une preuve","e":"provide evidence"},{"i":"d192c6","f":"demander une correction","e":"request correction"},{"i":"d192c7","f":"un remboursement","e":"refund"},{"i":"d192c8","f":"saisir un service","e":"refer/contact a service"}]},{"d":193,"w":28,"c":[{"i":"d193c1","f":"une décision","e":"decision"},{"i":"d193c2","f":"demander un réexamen","e":"request reconsideration"},{"i":"d193c3","f":"un motif","e":"reason/ground"},{"i":"d193c4","f":"malgré","e":"despite"},{"i":"d193c5","f":"tenir compte de","e":"take into account"},{"i":"d193c6","f":"un élément nouveau","e":"new information"},{"i":"d193c7","f":"joindre une pièce","e":"attach document"},{"i":"d193c8","f":"réévaluer","e":"reassess"}]},{"d":194,"w":28,"c":[{"i":"d194c1","f":"une consultation publique","e":"public consultation"},{"i":"d194c2","f":"exprimer une préoccupation","e":"raise a concern"},{"i":"d194c3","f":"il est important que","e":"it is important that"},{"i":"d194c4","f":"prendre en compte","e":"consider"},{"i":"d194c5","f":"proposer une modification","e":"propose change"},{"i":"d194c6","f":"accessible à tous","e":"accessible to all"},{"i":"d194c7","f":"recueillir des avis","e":"collect views"},{"i":"d194c8","f":"parvenir à un équilibre","e":"strike a balance"}]},{"d":195,"w":28,"c":[{"i":"d195c1","f":"en termes simples","e":"in simple terms"},{"i":"d195c2","f":"cela signifie que","e":"this means that"},{"i":"d195c3","f":"autrement dit","e":"in other words"},{"i":"d195c4","f":"dans votre cas","e":"in your case"},{"i":"d195c5","f":"vous pouvez","e":"you may/can"},{"i":"d195c6","f":"vous devez","e":"you must"},{"i":"d195c7","f":"sauf si","e":"unless"},{"i":"d195c8","f":"demander conseil","e":"seek advice"}]},{"d":196,"w":28,"c":[{"i":"d196c1","f":"respecter ses droits","e":"uphold one's rights"},{"i":"d196c2","f":"remplir ses obligations","e":"meet obligations"},{"i":"d196c3","f":"déposer une plainte","e":"file a complaint"},{"i":"d196c4","f":"demander un recours","e":"seek recourse"},{"i":"d196c5","f":"fournir des preuves","e":"provide evidence"},{"i":"d196c6","f":"respecter une procédure","e":"follow procedure"},{"i":"d196c7","f":"obtenir une décision","e":"receive decision"},{"i":"d196c8","f":"faire appel","e":"appeal"}]},{"d":197,"w":29,"c":[{"i":"d197c1","f":"un mode de vie","e":"lifestyle"},{"i":"d197c2","f":"sédentaire","e":"sedentary"},{"i":"d197c3","f":"équilibré","e":"balanced"},{"i":"d197c4","f":"régulièrement","e":"regularly"},{"i":"d197c5","f":"manquer de sommeil","e":"lack sleep"},{"i":"d197c6","f":"prendre une pause","e":"take a break"},{"i":"d197c7","f":"maintenir","e":"maintain"},{"i":"d197c8","f":"avoir tendance à","e":"tend to"}]},{"d":198,"w":29,"c":[{"i":"d198c1","f":"un antécédent","e":"medical history"},{"i":"d198c2","f":"une allergie","e":"allergy"},{"i":"d198c3","f":"un traitement","e":"treatment"},{"i":"d198c4","f":"une ordonnance","e":"prescription"},{"i":"d198c5","f":"depuis combien de temps","e":"for how long"},{"i":"d198c6","f":"s'aggraver","e":"worsen"},{"i":"d198c7","f":"s'améliorer","e":"improve"},{"i":"d198c8","f":"un effet secondaire","e":"side effect"}]},{"d":199,"w":29,"c":[{"i":"d199c1","f":"suivre un traitement","e":"follow treatment"},{"i":"d199c2","f":"respecter la dose","e":"follow dosage"},{"i":"d199c3","f":"éviter de","e":"avoid"},{"i":"d199c4","f":"surveiller","e":"monitor"},{"i":"d199c5","f":"consulter rapidement","e":"seek care quickly"},{"i":"d199c6","f":"en cas de","e":"in case of"},{"i":"d199c7","f":"s'améliorer","e":"improve"},{"i":"d199c8","f":"persister","e":"persist"}]},{"d":200,"w":29,"c":[{"i":"d200c1","f":"une source de stress","e":"stressor"},{"i":"d200c2","f":"se sentir dépassé","e":"feel overwhelmed"},{"i":"d200c3","f":"avoir du mal à","e":"struggle to"},{"i":"d200c4","f":"avoir un impact sur","e":"impact"},{"i":"d200c5","f":"une stratégie","e":"strategy"},{"i":"d200c6","f":"respirer profondément","e":"breathe deeply"},{"i":"d200c7","f":"établir des limites","e":"set boundaries"},{"i":"d200c8","f":"demander du soutien","e":"seek support"}]},{"d":201,"w":29,"c":[{"i":"d201c1","f":"une affirmation de santé","e":"health claim"},{"i":"d201c2","f":"une étude","e":"study"},{"i":"d201c3","f":"une source médicale","e":"medical source"},{"i":"d201c4","f":"être prouvé","e":"be proven"},{"i":"d201c5","f":"manquer de preuves","e":"lack evidence"},{"i":"d201c6","f":"il se peut que","e":"it may be"},{"i":"d201c7","f":"consulter un professionnel","e":"consult professional"},{"i":"d201c8","f":"fiable","e":"reliable"}]},{"d":202,"w":29,"c":[{"i":"d202c1","f":"un objectif réaliste","e":"realistic goal"},{"i":"d202c2","f":"mesurable","e":"measurable"},{"i":"d202c3","f":"progressivement","e":"gradually"},{"i":"d202c4","f":"suivre ses progrès","e":"track progress"},{"i":"d202c5","f":"ajuster","e":"adjust"},{"i":"d202c6","f":"tenir sur la durée","e":"sustain"},{"i":"d202c7","f":"si nécessaire","e":"if necessary"},{"i":"d202c8","f":"célébrer un progrès","e":"celebrate progress"}]},{"d":203,"w":29,"c":[{"i":"d203c1","f":"prévenir","e":"prevent"},{"i":"d203c2","f":"surveiller","e":"monitor"},{"i":"d203c3","f":"évaluer","e":"assess"},{"i":"d203c4","f":"s'adapter","e":"adapt"},{"i":"d203c5","f":"persister","e":"persist"},{"i":"d203c6","f":"demander de l'aide","e":"seek help"},{"i":"d203c7","f":"une amélioration","e":"improvement"},{"i":"d203c8","f":"un suivi","e":"follow-up"}]},{"d":204,"w":30,"c":[{"i":"d204c1","f":"les deux documents","e":"both documents"},{"i":"d204c2","f":"traiter de","e":"deal with"},{"i":"d204c3","f":"avoir en commun","e":"have in common"},{"i":"d204c4","f":"se distinguer par","e":"differ through"},{"i":"d204c5","f":"tandis que","e":"whereas"},{"i":"d204c6","f":"compléter","e":"complement"},{"i":"d204c7","f":"contredire","e":"contradict"},{"i":"d204c8","f":"une synthèse","e":"synthesis"}]},{"d":205,"w":30,"c":[{"i":"d205c1","f":"le sujet principal","e":"main topic"},{"i":"d205c2","f":"un point clé","e":"key point"},{"i":"d205c3","f":"un exemple","e":"example"},{"i":"d205c4","f":"une cause","e":"cause"},{"i":"d205c5","f":"une conséquence","e":"consequence"},{"i":"d205c6","f":"une solution","e":"solution"},{"i":"d205c7","f":"le point de vue","e":"viewpoint"},{"i":"d205c8","f":"reformuler","e":"rephrase"}]},{"d":206,"w":30,"c":[{"i":"d206c1","f":"aujourd'hui, je vais parler de","e":"today I will discuss"},{"i":"d206c2","f":"mon exposé comporte","e":"my presentation has"},{"i":"d206c3","f":"passons maintenant à","e":"let us move to"},{"i":"d206c4","f":"comme vous pouvez le constater","e":"as you can see"},{"i":"d206c5","f":"un exemple concret","e":"concrete example"},{"i":"d206c6","f":"pour résumer","e":"to summarize"},{"i":"d206c7","f":"je répondrai aux questions","e":"I will answer questions"},{"i":"d206c8","f":"merci de votre attention","e":"thank you"}]},{"d":207,"w":30,"c":[{"i":"d207c1","f":"pourriez-vous préciser ?","e":"could you clarify?"},{"i":"d207c2","f":"voici ma contrainte","e":"here is my constraint"},{"i":"d207c3","f":"je comprends votre priorité","e":"I understand your priority"},{"i":"d207c4","f":"une autre possibilité","e":"another possibility"},{"i":"d207c5","f":"cela ne serait possible que si","e":"this would only be possible if"},{"i":"d207c6","f":"faisons un compromis","e":"let us compromise"},{"i":"d207c7","f":"confirmer par écrit","e":"confirm in writing"},{"i":"d207c8","f":"convenir d'une date","e":"agree a date"}]},{"d":208,"w":30,"c":[{"i":"d208c1","f":"présenter le contexte","e":"present context"},{"i":"d208c2","f":"formuler la question","e":"formulate question"},{"i":"d208c3","f":"défendre une position","e":"defend position"},{"i":"d208c4","f":"développer","e":"develop"},{"i":"d208c5","f":"illustrer","e":"illustrate"},{"i":"d208c6","f":"reconnaître une limite","e":"acknowledge limitation"},{"i":"d208c7","f":"réfuter","e":"rebut"},{"i":"d208c8","f":"conclure","e":"conclude"}]},{"d":209,"w":30,"c":[{"i":"d209c1","f":"respecter le temps","e":"keep to time"},{"i":"d209c2","f":"comprendre la consigne","e":"understand prompt"},{"i":"d209c3","f":"sélectionner l'essentiel","e":"select essentials"},{"i":"d209c4","f":"développer suffisamment","e":"develop enough"},{"i":"d209c5","f":"utiliser une structure","e":"use structure"},{"i":"d209c6","f":"vérifier la cohérence","e":"check coherence"},{"i":"d209c7","f":"corriger les erreurs","e":"correct errors"},{"i":"d209c8","f":"noter le résultat","e":"record result"}]},{"d":210,"w":30,"c":[{"i":"d210c1","f":"un niveau autonome","e":"independent level"},{"i":"d210c2","f":"une compétence stable","e":"stable skill"},{"i":"d210c3","f":"une amélioration","e":"improvement"},{"i":"d210c4","f":"une difficulté persistante","e":"persistent difficulty"},{"i":"d210c5","f":"une stratégie efficace","e":"effective strategy"},{"i":"d210c6","f":"fixer une cible","e":"set target"},{"i":"d210c7","f":"suivre les résultats","e":"track results"},{"i":"d210c8","f":"la prochaine étape","e":"next step"}]},{"d":211,"w":31,"c":[{"i":"d211c1","f":"avant cela","e":"before that"},{"i":"d211c2","f":"j'avais déjà","e":"I had already"},{"i":"d211c3","f":"pendant que","e":"while"},{"i":"d211c4","f":"tout à coup","e":"suddenly"},{"i":"d211c5","f":"par la suite","e":"subsequently"},{"i":"d211c6","f":"entre-temps","e":"meanwhile"},{"i":"d211c7","f":"finalement","e":"finally"},{"i":"d211c8","f":"avec le recul","e":"in hindsight"}]},{"d":212,"w":31,"c":[{"i":"d212c1","f":"affirmer que","e":"state that"},{"i":"d212c2","f":"expliquer que","e":"explain that"},{"i":"d212c3","f":"demander si","e":"ask whether"},{"i":"d212c4","f":"répondre que","e":"reply that"},{"i":"d212c5","f":"préciser que","e":"clarify that"},{"i":"d212c6","f":"promettre de","e":"promise to"},{"i":"d212c7","f":"conseiller de","e":"advise to"},{"i":"d212c8","f":"selon ses paroles","e":"according to their words"}]},{"d":213,"w":31,"c":[{"i":"d213c1","f":"sans prévenir","e":"without warning"},{"i":"d213c2","f":"à peine...que","e":"hardly...when"},{"i":"d213c3","f":"au même moment","e":"at the same moment"},{"i":"d213c4","f":"quelques instants plus tard","e":"moments later"},{"i":"d213c5","f":"retenir son souffle","e":"hold one's breath"},{"i":"d213c6","f":"ignorer","e":"be unaware"},{"i":"d213c7","f":"s'apercevoir","e":"notice/realize"},{"i":"d213c8","f":"le suspense","e":"suspense"}]},{"d":214,"w":31,"c":[{"i":"d214c1","f":"être responsable de","e":"be responsible for"},{"i":"d214c2","f":"être à l'origine de","e":"cause/originate"},{"i":"d214c3","f":"provoquer","e":"cause"},{"i":"d214c4","f":"faire réparer","e":"have repaired"},{"i":"d214c5","f":"reconnaître sa faute","e":"admit fault"},{"i":"d214c6","f":"assumer","e":"take responsibility"},{"i":"d214c7","f":"éviter","e":"prevent"},{"i":"d214c8","f":"tirer une leçon","e":"learn a lesson"}]},{"d":215,"w":31,"c":[{"i":"d215c1","f":"j'aurais dû","e":"I should have"},{"i":"d215c2","f":"j'aurais pu","e":"I could have"},{"i":"d215c3","f":"j'aurais voulu","e":"I would have liked"},{"i":"d215c4","f":"si j'avais su","e":"if I had known"},{"i":"d215c5","f":"regretter","e":"regret"},{"i":"d215c6","f":"autrement","e":"differently"},{"i":"d215c7","f":"une occasion manquée","e":"missed opportunity"},{"i":"d215c8","f":"désormais","e":"from now on"}]},{"d":216,"w":31,"c":[{"i":"d216c1","f":"ce qui m'a marqué","e":"what struck me"},{"i":"d216c2","f":"le moment décisif","e":"decisive moment"},{"i":"d216c3","f":"contre toute attente","e":"unexpectedly"},{"i":"d216c4","f":"j'ai compris que","e":"I realized that"},{"i":"d216c5","f":"cette expérience m'a appris","e":"this experience taught me"},{"i":"d216c6","f":"en y repensant","e":"thinking back"},{"i":"d216c7","f":"un tournant","e":"turning point"},{"i":"d216c8","f":"répondre aux questions","e":"answer questions"}]},{"d":217,"w":31,"c":[{"i":"d217c1","f":"situer","e":"situate"},{"i":"d217c2","f":"rapporter","e":"report"},{"i":"d217c3","f":"enchaîner","e":"sequence"},{"i":"d217c4","f":"expliquer","e":"explain"},{"i":"d217c5","f":"reconnaître","e":"acknowledge"},{"i":"d217c6","f":"réfléchir","e":"reflect"},{"i":"d217c7","f":"une conséquence imprévue","e":"unforeseen consequence"},{"i":"d217c8","f":"une leçon durable","e":"lasting lesson"}]},{"d":218,"w":32,"c":[{"i":"d218c1","f":"un diplôme","e":"degree"},{"i":"d218c2","f":"une formation","e":"training"},{"i":"d218c3","f":"un domaine","e":"field"},{"i":"d218c4","f":"obtenir","e":"obtain"},{"i":"d218c5","f":"poursuivre ses études","e":"continue studies"},{"i":"d218c6","f":"se spécialiser en","e":"specialize in"},{"i":"d218c7","f":"acquérir des compétences","e":"gain skills"},{"i":"d218c8","f":"un parcours","e":"background/path"}]},{"d":219,"w":32,"c":[{"i":"d219c1","f":"en pratiquant","e":"by practicing"},{"i":"d219c2","f":"en écoutant","e":"by listening"},{"i":"d219c3","f":"en répétant","e":"by repeating"},{"i":"d219c4","f":"prendre des notes","e":"take notes"},{"i":"d219c5","f":"espacer les révisions","e":"space reviews"},{"i":"d219c6","f":"mémoriser","e":"memorize"},{"i":"d219c7","f":"rester régulier","e":"stay consistent"},{"i":"d219c8","f":"évaluer ses progrès","e":"assess progress"}]},{"d":220,"w":32,"c":[{"i":"d220c1","f":"un programme","e":"program"},{"i":"d220c2","f":"des prérequis","e":"prerequisites"},{"i":"d220c3","f":"à temps partiel","e":"part-time"},{"i":"d220c4","f":"à distance","e":"remote"},{"i":"d220c5","f":"être reconnu","e":"be recognized"},{"i":"d220c6","f":"un accompagnement","e":"support"},{"i":"d220c7","f":"correspondre à ses objectifs","e":"match goals"},{"i":"d220c8","f":"un investissement","e":"investment"}]},{"d":221,"w":32,"c":[{"i":"d221c1","f":"démontrer","e":"demonstrate"},{"i":"d221c2","f":"mener à bien","e":"complete successfully"},{"i":"d221c3","f":"résoudre","e":"solve"},{"i":"d221c4","f":"concevoir","e":"design"},{"i":"d221c5","f":"grâce à","e":"thanks to"},{"i":"d221c6","f":"ce qui a permis de","e":"which enabled"},{"i":"d221c7","f":"un résultat mesurable","e":"measurable result"},{"i":"d221c8","f":"une réalisation","e":"achievement"}]},{"d":222,"w":32,"c":[{"i":"d222c1","f":"à court terme","e":"short term"},{"i":"d222c2","f":"à moyen terme","e":"medium term"},{"i":"d222c3","f":"à long terme","e":"long term"},{"i":"d222c4","f":"évoluer vers","e":"progress toward"},{"i":"d222c5","f":"approfondir","e":"deepen"},{"i":"d222c6","f":"assumer davantage de responsabilités","e":"take more responsibility"},{"i":"d222c7","f":"si l'occasion se présente","e":"if opportunity arises"},{"i":"d222c8","f":"atteindre","e":"achieve"}]},{"d":223,"w":32,"c":[{"i":"d223c1","f":"parlez-moi de vous","e":"tell me about yourself"},{"i":"d223c2","f":"une force","e":"strength"},{"i":"d223c3","f":"une difficulté surmontée","e":"challenge overcome"},{"i":"d223c4","f":"apporter de la valeur","e":"add value"},{"i":"d223c5","f":"correspondre au poste","e":"fit role"},{"i":"d223c6","f":"un exemple récent","e":"recent example"},{"i":"d223c7","f":"apprendre rapidement","e":"learn quickly"},{"i":"d223c8","f":"poser une question pertinente","e":"ask relevant question"}]},{"d":224,"w":32,"c":[{"i":"d224c1","f":"se former","e":"train"},{"i":"d224c2","f":"se perfectionner","e":"improve/master"},{"i":"d224c3","f":"valoriser","e":"highlight"},{"i":"d224c4","f":"transférable","e":"transferable"},{"i":"d224c5","f":"une candidature","e":"application"},{"i":"d224c6","f":"un entretien","e":"interview"},{"i":"d224c7","f":"une évolution","e":"progression"},{"i":"d224c8","f":"saisir une occasion","e":"seize opportunity"}]},{"d":225,"w":33,"c":[{"i":"d225c1","f":"un système","e":"system"},{"i":"d225c2","f":"traiter des données","e":"process data"},{"i":"d225c3","f":"reconnaître","e":"recognize"},{"i":"d225c4","f":"générer","e":"generate"},{"i":"d225c5","f":"ce qui signifie","e":"which means"},{"i":"d225c6","f":"en termes simples","e":"in simple terms"},{"i":"d225c7","f":"comparable à","e":"comparable to"},{"i":"d225c8","f":"un cas d'usage","e":"use case"}]},{"d":226,"w":33,"c":[{"i":"d226c1","f":"un gain d'efficacité","e":"efficiency gain"},{"i":"d226c2","f":"une limite","e":"limitation"},{"i":"d226c3","f":"tout en","e":"while"},{"i":"d226c4","f":"dépendre de","e":"depend on"},{"i":"d226c5","f":"une erreur","e":"error"},{"i":"d226c6","f":"une supervision humaine","e":"human oversight"},{"i":"d226c7","f":"fiable","e":"reliable"},{"i":"d226c8","f":"à grande échelle","e":"at scale"}]},{"d":227,"w":33,"c":[{"i":"d227c1","f":"la vie privée","e":"privacy"},{"i":"d227c2","f":"des données personnelles","e":"personal data"},{"i":"d227c3","f":"le consentement","e":"consent"},{"i":"d227c4","f":"recueillir","e":"collect"},{"i":"d227c5","f":"conserver","e":"retain"},{"i":"d227c6","f":"partager","e":"share"},{"i":"d227c7","f":"être informé","e":"be informed"},{"i":"d227c8","f":"retirer son consentement","e":"withdraw consent"}]},{"d":228,"w":33,"c":[{"i":"d228c1","f":"un biais","e":"bias"},{"i":"d228c2","f":"équitable","e":"fair"},{"i":"d228c3","f":"sous-représenté","e":"underrepresented"},{"i":"d228c4","f":"entraîner","e":"lead to"},{"i":"d228c5","f":"désavantager","e":"disadvantage"},{"i":"d228c6","f":"tester","e":"test"},{"i":"d228c7","f":"surveiller","e":"monitor"},{"i":"d228c8","f":"corriger","e":"correct"}]},{"d":229,"w":33,"c":[{"i":"d229c1","f":"une information trompeuse","e":"misleading information"},{"i":"d229c2","f":"vérifier l'auteur","e":"check author"},{"i":"d229c3","f":"une source primaire","e":"primary source"},{"i":"d229c4","f":"recouper","e":"cross-check"},{"i":"d229c5","f":"hors contexte","e":"out of context"},{"i":"d229c6","f":"être manipulé","e":"be manipulated"},{"i":"d229c7","f":"crédible","e":"credible"},{"i":"d229c8","f":"signaler","e":"report/flag"}]},{"d":230,"w":33,"c":[{"i":"d230c1","f":"un usage responsable","e":"responsible use"},{"i":"d230c2","f":"une ligne directrice","e":"guideline"},{"i":"d230c3","f":"pour que","e":"so that"},{"i":"d230c4","f":"il faut que","e":"it is necessary that"},{"i":"d230c5","f":"rendre des comptes","e":"be accountable"},{"i":"d230c6","f":"documenter","e":"document"},{"i":"d230c7","f":"auditer","e":"audit"},{"i":"d230c8","f":"protéger les utilisateurs","e":"protect users"}]},{"d":231,"w":33,"c":[{"i":"d231c1","f":"innover","e":"innovate"},{"i":"d231c2","f":"évaluer","e":"evaluate"},{"i":"d231c3","f":"encadrer","e":"govern"},{"i":"d231c4","f":"protéger","e":"protect"},{"i":"d231c5","f":"vérifier","e":"verify"},{"i":"d231c6","f":"rendre transparent","e":"make transparent"},{"i":"d231c7","f":"assumer la responsabilité","e":"take responsibility"},{"i":"d231c8","f":"inspirer confiance","e":"build trust"}]},{"d":232,"w":34,"c":[{"i":"d232c1","f":"un enjeu public","e":"public issue"},{"i":"d232c2","f":"l'augmentation","e":"increase"},{"i":"d232c3","f":"la réduction","e":"reduction"},{"i":"d232c4","f":"être confronté à","e":"face"},{"i":"d232c5","f":"toucher","e":"affect"},{"i":"d232c6","f":"une cause structurelle","e":"structural cause"},{"i":"d232c7","f":"s'aggraver","e":"worsen"},{"i":"d232c8","f":"nécessiter une intervention","e":"require intervention"}]},{"d":233,"w":34,"c":[{"i":"d233c1","f":"une partie prenante","e":"stakeholder"},{"i":"d233c2","f":"être concerné par","e":"be affected by"},{"i":"d233c3","f":"défendre ses intérêts","e":"defend interests"},{"i":"d233c4","f":"craindre que","e":"fear that"},{"i":"d233c5","f":"réclamer","e":"demand"},{"i":"d233c6","f":"soutenir","e":"support"},{"i":"d233c7","f":"s'opposer à","e":"oppose"},{"i":"d233c8","f":"parvenir à un accord","e":"reach agreement"}]},{"d":234,"w":34,"c":[{"i":"d234c1","f":"un scénario","e":"scenario"},{"i":"d234c2","f":"si la mesure était adoptée","e":"if measure were adopted"},{"i":"d234c3","f":"avoir pour effet de","e":"have effect of"},{"i":"d234c4","f":"un coût initial","e":"initial cost"},{"i":"d234c5","f":"un bénéfice durable","e":"lasting benefit"},{"i":"d234c6","f":"faisable","e":"feasible"},{"i":"d234c7","f":"équitable","e":"equitable"},{"i":"d234c8","f":"un effet secondaire","e":"side effect"}]},{"d":235,"w":34,"c":[{"i":"d235c1","f":"un compromis","e":"trade-off/compromise"},{"i":"d235c2","f":"au détriment de","e":"at the expense of"},{"i":"d235c3","f":"équilibrer","e":"balance"},{"i":"d235c4","f":"même si","e":"even if"},{"i":"d235c5","f":"malgré","e":"despite"},{"i":"d235c6","f":"privilégier","e":"prioritize"},{"i":"d235c7","f":"acceptable","e":"acceptable"},{"i":"d235c8","f":"atténuer","e":"mitigate"}]},{"d":236,"w":34,"c":[{"i":"d236c1","f":"mettre en œuvre","e":"implement"},{"i":"d236c2","f":"une phase","e":"phase"},{"i":"d236c3","f":"allouer des ressources","e":"allocate resources"},{"i":"d236c4","f":"être chargé de","e":"be tasked with"},{"i":"d236c5","f":"un indicateur","e":"indicator"},{"i":"d236c6","f":"suivre","e":"monitor"},{"i":"d236c7","f":"ajuster","e":"adjust"},{"i":"d236c8","f":"rendre compte","e":"report"}]},{"d":237,"w":34,"c":[{"i":"d237c1","f":"permettez-moi de présenter","e":"allow me to present"},{"i":"d237c2","f":"pourquoi maintenant ?","e":"why now?"},{"i":"d237c3","f":"les faits montrent","e":"facts show"},{"i":"d237c4","f":"notre proposition","e":"our proposal"},{"i":"d237c5","f":"concrètement","e":"concretely"},{"i":"d237c6","f":"répondre aux préoccupations","e":"address concerns"},{"i":"d237c7","f":"une question légitime","e":"legitimate question"},{"i":"d237c8","f":"rendre le plan crédible","e":"make plan credible"}]},{"d":238,"w":34,"c":[{"i":"d238c1","f":"analyser","e":"analyze"},{"i":"d238c2","f":"consulter","e":"consult"},{"i":"d238c3","f":"évaluer","e":"evaluate"},{"i":"d238c4","f":"arbitrer","e":"balance/decide"},{"i":"d238c5","f":"mettre en œuvre","e":"implement"},{"i":"d238c6","f":"mesurer","e":"measure"},{"i":"d238c7","f":"ajuster","e":"adjust"},{"i":"d238c8","f":"rendre public","e":"make public"}]},{"d":239,"w":35,"c":[{"i":"d239c1","f":"converger","e":"converge"},{"i":"d239c2","f":"diverger","e":"diverge"},{"i":"d239c3","f":"mettre l'accent sur","e":"emphasize"},{"i":"d239c4","f":"compléter","e":"complement"},{"i":"d239c5","f":"remettre en question","e":"question/challenge"},{"i":"d239c6","f":"selon plusieurs sources","e":"according to several sources"},{"i":"d239c7","f":"une tendance commune","e":"common trend"},{"i":"d239c8","f":"une divergence majeure","e":"major difference"}]},{"d":240,"w":35,"c":[{"i":"d240c1","f":"laisser entendre","e":"imply"},{"i":"d240c2","f":"suggérer","e":"suggest"},{"i":"d240c3","f":"le ton révèle","e":"tone reveals"},{"i":"d240c4","f":"sembler hésitant","e":"seem hesitant"},{"i":"d240c5","f":"exprimer implicitement","e":"express implicitly"},{"i":"d240c6","f":"une intention","e":"intention"},{"i":"d240c7","f":"une attitude","e":"attitude"},{"i":"d240c8","f":"une inférence","e":"inference"}]},{"d":241,"w":35,"c":[{"i":"d241c1","f":"la question mérite réflexion","e":"issue deserves thought"},{"i":"d241c2","f":"j'adopterai la position suivante","e":"I take following position"},{"i":"d241c3","f":"un premier élément","e":"first consideration"},{"i":"d241c4","f":"on pourrait objecter que","e":"one might object"},{"i":"d241c5","f":"cette objection est importante","e":"objection is important"},{"i":"d241c6","f":"néanmoins","e":"nevertheless"},{"i":"d241c7","f":"dans l'ensemble","e":"overall"},{"i":"d241c8","f":"je maintiens que","e":"I maintain that"}]},{"d":242,"w":35,"c":[{"i":"d242c1","f":"si je comprends votre question","e":"if I understand your question"},{"i":"d242c2","f":"permettez-moi de réfléchir","e":"let me think"},{"i":"d242c3","f":"je nuancerais ma réponse","e":"I would qualify my answer"},{"i":"d242c4","f":"ce que je veux dire","e":"what I mean"},{"i":"d242c5","f":"pour être plus précis","e":"to be more precise"},{"i":"d242c6","f":"je me corrige","e":"I correct myself"},{"i":"d242c7","f":"cela dépend du contexte","e":"it depends on context"},{"i":"d242c8","f":"je n'ai pas assez d'informations","e":"I lack enough information"}]},{"d":243,"w":35,"c":[{"i":"d243c1","f":"d'après les documents","e":"according to documents"},{"i":"d243c2","f":"les sources soulignent","e":"sources emphasize"},{"i":"d243c3","f":"il ressort que","e":"it emerges that"},{"i":"d243c4","f":"pour ma part","e":"for my part"},{"i":"d243c5","f":"ces éléments montrent","e":"these points show"},{"i":"d243c6","f":"toutefois","e":"however"},{"i":"d243c7","f":"je proposerais","e":"I would propose"},{"i":"d243c8","f":"en définitive","e":"ultimately"}]},{"d":244,"w":35,"c":[{"i":"d244c1","f":"gérer la complexité","e":"manage complexity"},{"i":"d244c2","f":"hiérarchiser","e":"prioritize"},{"i":"d244c3","f":"distinguer","e":"distinguish"},{"i":"d244c4","f":"interpréter","e":"interpret"},{"i":"d244c5","f":"soutenir","e":"support"},{"i":"d244c6","f":"interagir","e":"interact"},{"i":"d244c7","f":"réviser","e":"revise"},{"i":"d244c8","f":"mesurer","e":"measure"}]},{"d":245,"w":35,"c":[{"i":"d245c1","f":"franchir un cap","e":"reach a milestone"},{"i":"d245c2","f":"gagner en autonomie","e":"become more independent"},{"i":"d245c3","f":"approfondir","e":"deepen"},{"i":"d245c4","f":"une erreur résiduelle","e":"remaining error"},{"i":"d245c5","f":"maintenir la précision","e":"maintain accuracy"},{"i":"d245c6","f":"développer la spontanéité","e":"develop spontaneity"},{"i":"d245c7","f":"viser le niveau B2","e":"aim for B2"},{"i":"d245c8","f":"la phase suivante","e":"next phase"}]},{"d":246,"w":36,"c":[{"i":"d246c1","f":"annoncer le sujet","e":"introduce topic"},{"i":"d246c2","f":"développer un point","e":"develop a point"},{"i":"d246c3","f":"passer à","e":"move to"},{"i":"d246c4","f":"en outre","e":"moreover"},{"i":"d246c5","f":"toutefois","e":"however"},{"i":"d246c6","f":"illustrer","e":"illustrate"},{"i":"d246c7","f":"résumer","e":"summarize"},{"i":"d246c8","f":"conclure","e":"conclude"}]},{"d":247,"w":36,"c":[{"i":"d247c1","f":"un détail essentiel","e":"essential detail"},{"i":"d247c2","f":"une précision","e":"clarification"},{"i":"d247c3","f":"une digression","e":"digression"},{"i":"d247c4","f":"ne retenir que","e":"retain only"},{"i":"d247c5","f":"mettre l'accent sur","e":"emphasize"},{"i":"d247c6","f":"contrairement à","e":"contrary to"},{"i":"d247c7","f":"corriger une idée","e":"correct an idea"},{"i":"d247c8","f":"un distracteur","e":"distractor"}]},{"d":248,"w":36,"c":[{"i":"d248c1","f":"enthousiaste","e":"enthusiastic"},{"i":"d248c2","f":"réservé","e":"cautious"},{"i":"d248c3","f":"sceptique","e":"skeptical"},{"i":"d248c4","f":"préoccupé","e":"concerned"},{"i":"d248c5","f":"ironique","e":"ironic"},{"i":"d248c6","f":"catégorique","e":"categorical"},{"i":"d248c7","f":"hésiter","e":"hesitate"},{"i":"d248c8","f":"approuver","e":"approve"}]},{"d":249,"w":36,"c":[{"i":"d249c1","f":"s entendre","e":"imply"},{"i":"d249c2","f":"sous-entendre","e":"imply"},{"i":"d249c3","f":"une allusion","e":"allusion"},{"i":"d249c4","f":"laisser penser que","e":"suggest that"},{"i":"d249c5","f":"vraisemblablement","e":"likely"},{"i":"d249c6","f":"on peut en déduire","e":"one can infer"},{"i":"d249c7","f":"faute de","e":"for lack of"},{"i":"d249c8","f":"sans le dire clairement","e":"without stating clearly"}]},{"d":250,"w":36,"c":[{"i":"d250c1","f":"environ","e":"approximately"},{"i":"d250c2","f":"près de","e":"nearly"},{"i":"d250c3","f":"plus d'un tiers","e":"more than a third"},{"i":"d250c4","f":"compris entre","e":"between"},{"i":"d250c5","f":"doubler","e":"double"},{"i":"d250c6","f":"diminuer de","e":"decrease by"},{"i":"d250c7","f":"à condition que","e":"provided that"},{"i":"d250c8","f":"sauf","e":"except"}]},{"d":251,"w":36,"c":[{"i":"d251c1","f":"une abréviation","e":"abbreviation"},{"i":"d251c2","f":"une flèche","e":"arrow"},{"i":"d251c3","f":"une opposition","e":"contrast"},{"i":"d251c4","f":"une cause","e":"cause"},{"i":"d251c5","f":"une conséquence","e":"consequence"},{"i":"d251c6","f":"un exemple","e":"example"},{"i":"d251c7","f":"un symbole","e":"symbol"},{"i":"d251c8","f":"reformuler immédiatement","e":"paraphrase immediately"}]},{"d":252,"w":36,"c":[{"i":"d252c1","f":"une écoute globale","e":"gist listening"},{"i":"d252c2","f":"une écoute ciblée","e":"targeted listening"},{"i":"d252c3","f":"anticiper","e":"anticipate"},{"i":"d252c4","f":"repérer","e":"identify"},{"i":"d252c5","f":"inférer","e":"infer"},{"i":"d252c6","f":"vérifier","e":"verify"},{"i":"d252c7","f":"une erreur d'attention","e":"attention error"},{"i":"d252c8","f":"une stratégie corrective","e":"corrective strategy"}]},{"d":253,"w":37,"c":[{"i":"d253c1","f":"je vous appelle au sujet de","e":"I am calling about"},{"i":"d253c2","f":"pourriez-vous m'indiquer","e":"could you tell me"},{"i":"d253c3","f":"qu'est-ce qui est compris ?","e":"what is included?"},{"i":"d253c4","f":"y a-t-il des frais ?","e":"are there fees?"},{"i":"d253c5","f":"dans quelles conditions ?","e":"under what conditions?"},{"i":"d253c6","f":"si j'ai bien compris","e":"if I understood"},{"i":"d253c7","f":"pourriez-vous confirmer","e":"could you confirm"},{"i":"d253c8","f":"autre question","e":"another question"}]},{"d":254,"w":37,"c":[{"i":"d254c1","f":"j'aimerais te proposer","e":"I would like to suggest"},{"i":"d254c2","f":"cela te permettrait de","e":"that would allow you"},{"i":"d254c3","f":"le principal avantage","e":"main advantage"},{"i":"d254c4","f":"tu pourrais","e":"you could"},{"i":"d254c5","f":"cela vaut la peine","e":"it is worth it"},{"i":"d254c6","f":"essayer","e":"try"},{"i":"d254c7","f":"profiter de","e":"benefit/enjoy"},{"i":"d254c8","f":"une occasion","e":"opportunity"}]},{"d":255,"w":37,"c":[{"i":"d255c1","f":"qu'est-ce qui t'inquiète ?","e":"what worries you?"},{"i":"d255c2","f":"si je comprends bien","e":"if I understand"},{"i":"d255c3","f":"ton principal souci","e":"main concern"},{"i":"d255c4","f":"est-ce surtout une question de...?","e":"is it mainly a matter of...?"},{"i":"d255c5","f":"reconnaître","e":"acknowledge"},{"i":"d255c6","f":"reformuler","e":"rephrase"},{"i":"d255c7","f":"une hésitation","e":"hesitation"},{"i":"d255c8","f":"une objection cachée","e":"hidden objection"}]},{"d":256,"w":37,"c":[{"i":"d256c1","f":"c'est vrai que","e":"it is true that"},{"i":"d256c2","f":"toutefois","e":"however"},{"i":"d256c3","f":"même si","e":"even if"},{"i":"d256c4","f":"en réalité","e":"in reality"},{"i":"d256c5","f":"une solution serait de","e":"one solution would be"},{"i":"d256c6","f":"réduire le coût","e":"reduce cost"},{"i":"d256c7","f":"gagner du temps","e":"save time"},{"i":"d256c8","f":"qu'en penses-tu ?","e":"what do you think?"}]},{"d":257,"w":37,"c":[{"i":"d257c1","f":"être réticent","e":"be reluctant"},{"i":"d257c2","f":"peser le pour et le contre","e":"weigh pros and cons"},{"i":"d257c3","f":"répondre à un besoin","e":"meet a need"},{"i":"d257c4","f":"dépasser un obstacle","e":"overcome obstacle"},{"i":"d257c5","f":"s'engager","e":"commit"},{"i":"d257c6","f":"essayer sans risque","e":"try risk-free"},{"i":"d257c7","f":"reconsidérer","e":"reconsider"},{"i":"d257c8","f":"parvenir à convaincre","e":"manage to persuade"}]},{"d":258,"w":37,"c":[{"i":"d258c1","f":"un groupe rythmique","e":"rhythm group"},{"i":"d258c2","f":"une liaison","e":"liaison"},{"i":"d258c3","f":"enchaîner","e":"link sounds/ideas"},{"i":"d258c4","f":"marquer une pause","e":"pause"},{"i":"d258c5","f":"mettre l'accent sur","e":"stress"},{"i":"d258c6","f":"éviter les hésitations","e":"avoid hesitation"},{"i":"d258c7","f":"reformuler","e":"rephrase"},{"i":"d258c8","f":"garder le rythme","e":"maintain rhythm"}]},{"d":259,"w":37,"c":[{"i":"d259c1","f":"prendre l'initiative","e":"take initiative"},{"i":"d259c2","f":"relancer","e":"follow up"},{"i":"d259c3","f":"développer","e":"expand"},{"i":"d259c4","f":"illustrer","e":"illustrate"},{"i":"d259c5","f":"nuancer","e":"qualify"},{"i":"d259c6","f":"vérifier l'accord","e":"check agreement"},{"i":"d259c7","f":"conclure efficacement","e":"conclude effectively"},{"i":"d259c8","f":"gérer le temps","e":"manage time"}]},{"d":260,"w":38,"c":[{"i":"d260c1","f":"le destinataire","e":"recipient"},{"i":"d260c2","f":"le but","e":"purpose"},{"i":"d260c3","f":"le registre","e":"register"},{"i":"d260c4","f":"un élément obligatoire","e":"required element"},{"i":"d260c5","f":"raconter","e":"narrate"},{"i":"d260c6","f":"expliquer","e":"explain"},{"i":"d260c7","f":"convaincre","e":"persuade"},{"i":"d260c8","f":"respecter la longueur","e":"meet length"}]},{"d":261,"w":38,"c":[{"i":"d261c1","f":"je me permets de vous écrire","e":"I am writing to you"},{"i":"d261c2","f":"conformément à","e":"in accordance with"},{"i":"d261c3","f":"malgré mes démarches","e":"despite my efforts"},{"i":"d261c4","f":"je vous serais reconnaissant de","e":"I would be grateful if"},{"i":"d261c5","f":"remédier à","e":"remedy"},{"i":"d261c6","f":"dans un délai de","e":"within a period of"},{"i":"d261c7","f":"à défaut de","e":"failing that"},{"i":"d261c8","f":"veuillez agréer","e":"formal closing"}]},{"d":262,"w":38,"c":[{"i":"d262c1","f":"poursuivre un récit","e":"continue a story"},{"i":"d262c2","f":"un point de vue","e":"viewpoint"},{"i":"d262c3","f":"maintenir le temps","e":"maintain tense"},{"i":"d262c4","f":"faire avancer l'action","e":"move action forward"},{"i":"d262c5","f":"un rebondissement","e":"twist"},{"i":"d262c6","f":"un indice","e":"clue"},{"i":"d262c7","f":"résoudre","e":"resolve"},{"i":"d262c8","f":"une chute","e":"ending/twist"}]},{"d":263,"w":38,"c":[{"i":"d263c1","f":"soulever une question","e":"raise an issue"},{"i":"d263c2","f":"être favorable à","e":"support"},{"i":"d263c3","f":"avancer un argument","e":"put forward argument"},{"i":"d263c4","f":"étayer","e":"substantiate"},{"i":"d263c5","f":"objecter","e":"object"},{"i":"d263c6","f":"reconnaître une limite","e":"acknowledge limit"},{"i":"d263c7","f":"réfuter","e":"rebut"},{"i":"d263c8","f":"préconiser","e":"advocate/recommend"}]},{"d":264,"w":38,"c":[{"i":"d264c1","f":"les documents présentent","e":"documents present"},{"i":"d264c2","f":"ils s'accordent sur","e":"agree on"},{"i":"d264c3","f":"ils divergent quant à","e":"differ regarding"},{"i":"d264c4","f":"sans reprendre les mots","e":"without copying words"},{"i":"d264c5","f":"pour ma part","e":"for my part"},{"i":"d264c6","f":"au vu de","e":"in light of"},{"i":"d264c7","f":"une position justifiée","e":"justified position"},{"i":"d264c8","f":"une proposition concrète","e":"concrete proposal"}]},{"d":265,"w":38,"c":[{"i":"d265c1","f":"une erreur qui gêne la compréhension","e":"comprehension-blocking error"},{"i":"d265c2","f":"une exigence manquante","e":"missing requirement"},{"i":"d265c3","f":"une phrase ambiguë","e":"ambiguous sentence"},{"i":"d265c4","f":"la cohérence","e":"coherence"},{"i":"d265c5","f":"la ponctuation","e":"punctuation"},{"i":"d265c6","f":"varier le vocabulaire","e":"vary vocabulary"},{"i":"d265c7","f":"raccourcir","e":"shorten"},{"i":"d265c8","f":"réserver du temps","e":"reserve time"}]},{"d":266,"w":38,"c":[{"i":"d266c1","f":"analyser la consigne","e":"analyze prompt"},{"i":"d266c2","f":"planifier","e":"plan"},{"i":"d266c3","f":"rédiger","e":"draft"},{"i":"d266c4","f":"développer","e":"develop"},{"i":"d266c5","f":"illustrer","e":"illustrate"},{"i":"d266c6","f":"réviser","e":"revise"},{"i":"d266c7","f":"respecter le registre","e":"maintain register"},{"i":"d266c8","f":"atteindre l'objectif","e":"achieve purpose"}]},{"d":267,"w":39,"c":[{"i":"d267c1","f":"survoler","e":"skim"},{"i":"d267c2","f":"le type de texte","e":"text type"},{"i":"d267c3","f":"le public visé","e":"target audience"},{"i":"d267c4","f":"informer","e":"inform"},{"i":"d267c5","f":"avertir","e":"warn"},{"i":"d267c6","f":"promouvoir","e":"promote"},{"i":"d267c7","f":"remettre en question","e":"challenge"},{"i":"d267c8","f":"l'intention","e":"intention"}]},{"d":268,"w":39,"c":[{"i":"d268c1","f":"balayer le texte","e":"scan text"},{"i":"d268c2","f":"un mot-clé","e":"keyword"},{"i":"d268c3","f":"un synonyme","e":"synonym"},{"i":"d268c4","f":"une référence","e":"reference"},{"i":"d268c5","f":"celui-ci renvoie à","e":"this refers to"},{"i":"d268c6","f":"une exception","e":"exception"},{"i":"d268c7","f":"une condition","e":"condition"},{"i":"d268c8","f":"repérer rapidement","e":"locate quickly"}]},{"d":269,"w":39,"c":[{"i":"d269c1","f":"introduire une cause","e":"introduce cause"},{"i":"d269c2","f":"marquer une opposition","e":"mark contrast"},{"i":"d269c3","f":"concéder","e":"concede"},{"i":"d269c4","f":"tirer une conséquence","e":"draw consequence"},{"i":"d269c5","f":"ajouter une réserve","e":"add reservation"},{"i":"d269c6","f":"renforcer","e":"reinforce"},{"i":"d269c7","f":"découler de","e":"stem from"},{"i":"d269c8","f":"en dépit de","e":"despite"}]},{"d":270,"w":39,"c":[{"i":"d270c1","f":"un mot apparenté","e":"related word"},{"i":"d270c2","f":"un préfixe","e":"prefix"},{"i":"d270c3","f":"un suffixe","e":"suffix"},{"i":"d270c4","f":"une collocation","e":"collocation"},{"i":"d270c5","f":"le contexte immédiat","e":"immediate context"},{"i":"d270c6","f":"une hypothèse de sens","e":"meaning hypothesis"},{"i":"d270c7","f":"vérifier","e":"verify"},{"i":"d270c8","f":"retenir l'usage","e":"retain usage"}]},{"d":271,"w":39,"c":[{"i":"d271c1","f":"présenter favorablement","e":"frame positively"},{"i":"d271c2","f":"minimiser","e":"minimize"},{"i":"d271c3","f":"exagérer","e":"exaggerate"},{"i":"d271c4","f":"sélectionner les faits","e":"select facts"},{"i":"d271c5","f":"une formulation chargée","e":"loaded wording"},{"i":"d271c6","f":"un présupposé","e":"assumption"},{"i":"d271c7","f":"manquer de neutralité","e":"lack neutrality"},{"i":"d271c8","f":"prendre ses distances","e":"distance oneself"}]},{"d":272,"w":39,"c":[{"i":"d272c1","f":"lire la question d'abord","e":"read question first"},{"i":"d272c2","f":"prévoir la réponse","e":"anticipate answer"},{"i":"d272c3","f":"éliminer","e":"eliminate"},{"i":"d272c4","f":"vérifier dans le texte","e":"verify in text"},{"i":"d272c5","f":"ne pas surinterpréter","e":"do not overinterpret"},{"i":"d272c6","f":"gérer une question difficile","e":"manage difficult question"},{"i":"d272c7","f":"revenir plus tard","e":"return later"},{"i":"d272c8","f":"noter le temps","e":"record time"}]},{"d":273,"w":39,"c":[{"i":"d273c1","f":"une lecture efficace","e":"efficient reading"},{"i":"d273c2","f":"une preuve textuelle","e":"textual evidence"},{"i":"d273c3","f":"une inférence justifiée","e":"justified inference"},{"i":"d273c4","f":"un piège","e":"trap"},{"i":"d273c5","f":"trop général","e":"too general"},{"i":"d273c6","f":"trop absolu","e":"too absolute"},{"i":"d273c7","f":"hors sujet","e":"irrelevant"},{"i":"d273c8","f":"ajuster sa stratégie","e":"adjust strategy"}]},{"d":274,"w":40,"c":[{"i":"d274c1","f":"une réponse exacte","e":"exact answer"},{"i":"d274c2","f":"une confusion sonore","e":"sound confusion"},{"i":"d274c3","f":"manquer un détail","e":"miss detail"},{"i":"d274c4","f":"interpréter trop vite","e":"infer too quickly"},{"i":"d274c5","f":"une condition","e":"condition"},{"i":"d274c6","f":"une exception","e":"exception"},{"i":"d274c7","f":"justifier","e":"justify"},{"i":"d274c8","f":"corriger la stratégie","e":"correct strategy"}]},{"d":275,"w":40,"c":[{"i":"d275c1","f":"une question de détail","e":"detail question"},{"i":"d275c2","f":"une question d'inférence","e":"inference question"},{"i":"d275c3","f":"un référent","e":"referent"},{"i":"d275c4","f":"un connecteur logique","e":"logical connector"},{"i":"d275c5","f":"manquer de temps","e":"run out of time"},{"i":"d275c6","f":"une preuve","e":"evidence"},{"i":"d275c7","f":"hésiter entre","e":"hesitate between"},{"i":"d275c8","f":"éliminer","e":"eliminate"}]},{"d":276,"w":40,"c":[{"i":"d276c1","f":"atteindre le but","e":"achieve purpose"},{"i":"d276c2","f":"développer suffisamment","e":"develop sufficiently"},{"i":"d276c3","f":"interagir","e":"interact"},{"i":"d276c4","f":"relancer","e":"prompt/follow up"},{"i":"d276c5","f":"une hésitation longue","e":"long hesitation"},{"i":"d276c6","f":"une erreur récurrente","e":"recurring error"},{"i":"d276c7","f":"une formulation naturelle","e":"natural phrasing"},{"i":"d276c8","f":"respecter le temps","e":"keep time"}]},{"d":277,"w":40,"c":[{"i":"d277c1","f":"respecter tous les points","e":"cover all points"},{"i":"d277c2","f":"organiser les paragraphes","e":"organize paragraphs"},{"i":"d277c3","f":"varier les structures","e":"vary structures"},{"i":"d277c4","f":"maintenir le registre","e":"maintain register"},{"i":"d277c5","f":"une faute d'accord","e":"agreement error"},{"i":"d277c6","f":"une erreur de temps","e":"tense error"},{"i":"d277c7","f":"une phrase maladroite","e":"awkward sentence"},{"i":"d277c8","f":"réécrire","e":"rewrite"}]},{"d":278,"w":40,"c":[{"i":"d278c1","f":"une priorité absolue","e":"top priority"},{"i":"d278c2","f":"avoir le plus d'impact","e":"have greatest impact"},{"i":"d278c3","f":"une erreur fréquente","e":"frequent error"},{"i":"d278c4","f":"cibler","e":"target"},{"i":"d278c5","f":"répéter délibérément","e":"practise deliberately"},{"i":"d278c6","f":"automatiser","e":"automate"},{"i":"d278c7","f":"vérifier le transfert","e":"check transfer"},{"i":"d278c8","f":"retester","e":"retest"}]},{"d":279,"w":40,"c":[{"i":"d279c1","f":"les conditions réelles","e":"realistic conditions"},{"i":"d279c2","f":"sans pause","e":"without pause"},{"i":"d279c3","f":"une limite de temps","e":"time limit"},{"i":"d279c4","f":"résister au stress","e":"handle stress"},{"i":"d279c5","f":"garder sa concentration","e":"maintain focus"},{"i":"d279c6","f":"passer à la suivante","e":"move on"},{"i":"d279c7","f":"vérifier à la fin","e":"check at end"},{"i":"d279c8","f":"consigner le score","e":"log score"}]},{"d":280,"w":40,"c":[{"i":"d280c1","f":"être proche de l'objectif","e":"be close to goal"},{"i":"d280c2","f":"une marge de progression","e":"room for improvement"},{"i":"d280c3","f":"un seuil","e":"threshold"},{"i":"d280c4","f":"une performance stable","e":"stable performance"},{"i":"d280c5","f":"sous pression","e":"under pressure"},{"i":"d280c6","f":"combler un écart","e":"close a gap"},{"i":"d280c7","f":"consolider","e":"consolidate"},{"i":"d280c8","f":"le plan final","e":"final plan"}]},{"d":281,"w":41,"c":[{"i":"d281c1","f":"une syllabe","e":"syllable"},{"i":"d281c2","f":"une liaison","e":"liaison"},{"i":"d281c3","f":"une terminaison","e":"ending"},{"i":"d281c4","f":"distinguer","e":"distinguish"},{"i":"d281c5","f":"confondre","e":"confuse"},{"i":"d281c6","f":"ralentir","e":"slow down"},{"i":"d281c7","f":"répéter en boucle","e":"loop/repeat"},{"i":"d281c8","f":"reconnaître automatiquement","e":"recognize automatically"}]},{"d":282,"w":41,"c":[{"i":"d282c1","f":"un indice sonore","e":"audio clue"},{"i":"d282c2","f":"le ton","e":"tone"},{"i":"d282c3","f":"une réserve","e":"reservation"},{"i":"d282c4","f":"sous-entendre","e":"imply"},{"i":"d282c5","f":"contredire","e":"contradict"},{"i":"d282c6","f":"une condition implicite","e":"implicit condition"},{"i":"d282c7","f":"justifier une inférence","e":"justify inference"},{"i":"d282c8","f":"niveau de confiance","e":"confidence level"}]},{"d":283,"w":41,"c":[{"i":"d283c1","f":"un référent","e":"referent"},{"i":"d283c2","f":"renvoyer à","e":"refer to"},{"i":"d283c3","f":"une opposition","e":"contrast"},{"i":"d283c4","f":"une concession","e":"concession"},{"i":"d283c5","f":"découler de","e":"follow from"},{"i":"d283c6","f":"reprendre une idée","e":"refer back to an idea"},{"i":"d283c7","f":"la phrase précédente","e":"previous sentence"},{"i":"d283c8","f":"vérifier le paragraphe","e":"check paragraph"}]},{"d":284,"w":41,"c":[{"i":"d284c1","f":"un rythme cible","e":"target pace"},{"i":"d284c2","f":"chronométrer","e":"time"},{"i":"d284c3","f":"survoler","e":"skim"},{"i":"d284c4","f":"repérer","e":"locate"},{"i":"d284c5","f":"éliminer","e":"eliminate"},{"i":"d284c6","f":"laisser provisoirement","e":"leave temporarily"},{"i":"d284c7","f":"revenir","e":"return"},{"i":"d284c8","f":"une minute gagnée","e":"minute saved"}]},{"d":285,"w":41,"c":[{"i":"d285c1","f":"gagner du temps","e":"buy time"},{"i":"d285c2","f":"permettez-moi de réfléchir","e":"let me think"},{"i":"d285c3","f":"autrement dit","e":"in other words"},{"i":"d285c4","f":"ce que je veux dire","e":"what I mean"},{"i":"d285c5","f":"reprendre","e":"restart/rephrase"},{"i":"d285c6","f":"éviter un silence","e":"avoid silence"},{"i":"d285c7","f":"maintenir le fil","e":"maintain thread"},{"i":"d285c8","f":"parler spontanément","e":"speak spontaneously"}]},{"d":286,"w":41,"c":[{"i":"d286c1","f":"une faute récurrente","e":"recurring error"},{"i":"d286c2","f":"un accord","e":"agreement"},{"i":"d286c3","f":"un temps verbal","e":"verb tense"},{"i":"d286c4","f":"une préposition","e":"preposition"},{"i":"d286c5","f":"corriger systématiquement","e":"correct systematically"},{"i":"d286c6","f":"créer une règle","e":"create a rule"},{"i":"d286c7","f":"une phrase modèle","e":"model sentence"},{"i":"d286c8","f":"transférer","e":"transfer"}]},{"d":287,"w":41,"c":[{"i":"d287c1","f":"un retest","e":"retest"},{"i":"d287c2","f":"comparer les résultats","e":"compare results"},{"i":"d287c3","f":"un taux d'erreur","e":"error rate"},{"i":"d287c4","f":"une amélioration mesurable","e":"measurable improvement"},{"i":"d287c5","f":"rester fragile","e":"remain weak"},{"i":"d287c6","f":"consolider","e":"consolidate"},{"i":"d287c7","f":"changer de stratégie","e":"change strategy"},{"i":"d287c8","f":"priorité finale","e":"final priority"}]},{"d":288,"w":42,"c":[{"i":"d288c1","f":"lire les options rapidement","e":"read options quickly"},{"i":"d288c2","f":"anticiper","e":"anticipate"},{"i":"d288c3","f":"écouter jusqu'au bout","e":"listen to the end"},{"i":"d288c4","f":"une nuance","e":"nuance"},{"i":"d288c5","f":"ne pas revenir","e":"not go back"},{"i":"d288c6","f":"choisir la meilleure réponse","e":"choose best answer"},{"i":"d288c7","f":"consigner","e":"record"},{"i":"d288c8","f":"analyser après","e":"analyze afterward"}]},{"d":289,"w":42,"c":[{"i":"d289c1","f":"répartir le temps","e":"allocate time"},{"i":"d289c2","f":"commencer par","e":"begin with"},{"i":"d289c3","f":"marquer une question","e":"flag question"},{"i":"d289c4","f":"éviter le perfectionnisme","e":"avoid perfectionism"},{"i":"d289c5","f":"vérifier la preuve","e":"verify evidence"},{"i":"d289c6","f":"une réponse plausible","e":"plausible answer"},{"i":"d289c7","f":"un piège lexical","e":"lexical trap"},{"i":"d289c8","f":"finir à temps","e":"finish on time"}]},{"d":290,"w":42,"c":[{"i":"d290c1","f":"prendre contact","e":"initiate contact"},{"i":"d290c2","f":"obtenir des précisions","e":"obtain details"},{"i":"d290c3","f":"convaincre","e":"persuade"},{"i":"d290c4","f":"relancer","e":"follow up"},{"i":"d290c5","f":"répondre à une objection","e":"answer objection"},{"i":"d290c6","f":"varier les arguments","e":"vary arguments"},{"i":"d290c7","f":"conclure par une action","e":"close with action"},{"i":"d290c8","f":"respecter la durée","e":"meet duration"}]},{"d":291,"w":42,"c":[{"i":"d291c1","f":"analyser en deux minutes","e":"analyze in two minutes"},{"i":"d291c2","f":"faire un plan bref","e":"make brief plan"},{"i":"d291c3","f":"rédiger sans s'arrêter","e":"draft continuously"},{"i":"d291c4","f":"développer chaque point","e":"develop every point"},{"i":"d291c5","f":"surveiller le registre","e":"monitor register"},{"i":"d291c6","f":"compter les mots","e":"count words"},{"i":"d291c7","f":"relire stratégiquement","e":"review strategically"},{"i":"d291c8","f":"remettre à temps","e":"submit on time"}]},{"d":292,"w":42,"c":[{"i":"d292c1","f":"une erreur de connaissance","e":"knowledge error"},{"i":"d292c2","f":"une erreur d'attention","e":"attention error"},{"i":"d292c3","f":"une erreur de stratégie","e":"strategy error"},{"i":"d292c4","f":"un problème de temps","e":"timing problem"},{"i":"d292c5","f":"une tendance","e":"pattern"},{"i":"d292c6","f":"une cause racine","e":"root cause"},{"i":"d292c7","f":"une action corrective","e":"corrective action"},{"i":"d292c8","f":"un seuil cible","e":"target threshold"}]},{"d":293,"w":42,"c":[{"i":"d293c1","f":"une simulation complète","e":"full simulation"},{"i":"d293c2","f":"conditions réalistes","e":"realistic conditions"},{"i":"d293c3","f":"une pause autorisée","e":"allowed break"},{"i":"d293c4","f":"rester concentré","e":"stay focused"},{"i":"d293c5","f":"gérer son énergie","e":"manage energy"},{"i":"d293c6","f":"appliquer la stratégie","e":"apply strategy"},{"i":"d293c7","f":"ne pas modifier après","e":"not change afterward"},{"i":"d293c8","f":"résultat brut","e":"raw result"}]},{"d":294,"w":42,"c":[{"i":"d294c1","f":"une tendance positive","e":"positive trend"},{"i":"d294c2","f":"une baisse","e":"decline"},{"i":"d294c3","f":"stable","e":"stable"},{"i":"d294c4","f":"dépasser le seuil","e":"exceed threshold"},{"i":"d294c5","f":"rester sous le seuil","e":"remain below threshold"},{"i":"d294c6","f":"une variation","e":"variation"},{"i":"d294c7","f":"être reproductible","e":"be repeatable"},{"i":"d294c8","f":"une priorité de dernière semaine","e":"final-week priority"}]},{"d":295,"w":43,"c":[{"i":"d295c1","f":"rester attentif","e":"stay attentive"},{"i":"d295c2","f":"écouter la fin","e":"listen to end"},{"i":"d295c3","f":"une négation","e":"negation"},{"i":"d295c4","f":"une réserve","e":"reservation"},{"i":"d295c5","f":"une condition","e":"condition"},{"i":"d295c6","f":"confirmer mentalement","e":"confirm mentally"},{"i":"d295c7","f":"faire confiance à sa méthode","e":"trust method"},{"i":"d295c8","f":"s'arrêter à temps","e":"stop on time"}]},{"d":296,"w":43,"c":[{"i":"d296c1","f":"lire avec un objectif","e":"read with purpose"},{"i":"d296c2","f":"repérer la preuve","e":"locate evidence"},{"i":"d296c3","f":"éviter une réponse absolue","e":"avoid absolute answer"},{"i":"d296c4","f":"surveiller les exceptions","e":"watch exceptions"},{"i":"d296c5","f":"garder le rythme","e":"maintain pace"},{"i":"d296c6","f":"marquer puis revenir","e":"flag then return"},{"i":"d296c7","f":"ne pas douter sans raison","e":"not doubt without reason"},{"i":"d296c8","f":"terminer calmement","e":"finish calmly"}]},{"d":297,"w":43,"c":[{"i":"d297c1","f":"respirer avant de commencer","e":"breathe before starting"},{"i":"d297c2","f":"prendre l'initiative","e":"take initiative"},{"i":"d297c3","f":"développer deux raisons","e":"develop two reasons"},{"i":"d297c4","f":"donner un exemple","e":"give example"},{"i":"d297c5","f":"écouter la réponse","e":"listen to response"},{"i":"d297c6","f":"reformuler si nécessaire","e":"rephrase if needed"},{"i":"d297c7","f":"conclure clairement","e":"conclude clearly"},{"i":"d297c8","f":"rester naturel","e":"stay natural"}]},{"d":298,"w":43,"c":[{"i":"d298c1","f":"identifier le but","e":"identify purpose"},{"i":"d298c2","f":"couvrir chaque point","e":"cover each point"},{"i":"d298c3","f":"une phrase directrice","e":"topic sentence"},{"i":"d298c4","f":"un exemple précis","e":"specific example"},{"i":"d298c5","f":"varier les connecteurs","e":"vary connectors"},{"i":"d298c6","f":"vérifier les verbes","e":"check verbs"},{"i":"d298c7","f":"vérifier les accords","e":"check agreements"},{"i":"d298c8","f":"s'arrêter à l'heure","e":"stop on time"}]},{"d":299,"w":43,"c":[{"i":"d299c1","f":"une pièce d'identité","e":"ID"},{"i":"d299c2","f":"une convocation","e":"appointment/admission notice"},{"i":"d299c3","f":"vérifier l'adresse","e":"verify address"},{"i":"d299c4","f":"prévoir le trajet","e":"plan route"},{"i":"d299c5","f":"arriver en avance","e":"arrive early"},{"i":"d299c6","f":"une collation","e":"snack"},{"i":"d299c7","f":"dormir suffisamment","e":"sleep enough"},{"i":"d299c8","f":"rester calme","e":"stay calm"}]},{"d":300,"w":43,"c":[{"i":"d300c1","f":"réviser légèrement","e":"review lightly"},{"i":"d300c2","f":"éviter de surcharger","e":"avoid overload"},{"i":"d300c3","f":"faire une promenade","e":"take a walk"},{"i":"d300c4","f":"préparer ses affaires","e":"prepare belongings"},{"i":"d300c5","f":"se détendre","e":"relax"},{"i":"d300c6","f":"se coucher tôt","e":"go to bed early"},{"i":"d300c7","f":"avoir confiance","e":"have confidence"},{"i":"d300c8","f":"être prêt","e":"be ready"}]},{"d":301,"w":43,"c":[{"i":"d301c1","f":"atteindre son objectif","e":"reach one's goal"},{"i":"d301c2","f":"accomplir","e":"accomplish"},{"i":"d301c3","f":"rester constant","e":"stay consistent"},{"i":"d301c4","f":"faire de son mieux","e":"do one's best"},{"i":"d301c5","f":"accepter l'incertitude","e":"accept uncertainty"},{"i":"d301c6","f":"appliquer sa méthode","e":"apply method"},{"i":"d301c7","f":"célébrer le chemin","e":"celebrate journey"},{"i":"d301c8","f":"poursuivre","e":"continue"}]}];
const TOTAL_DAYS = DAYS.length;

const GRAMMAR_DAYS = [{"d":1,"w":1,"k":"n","e":[{"b":"A1-A2","c":[1],"t":"Vous êtes japonais ?"},{"b":"A1-A2","c":[4],"t":"Je suis"}],"x":"Ch. 1 — Vous êtes japonais ? (presentation/nationality) + Ch. 4 — Je suis... (être au présent). Do selected exercises."},{"d":2,"w":1,"k":"n","e":[{"b":"A1-A2","c":[19],"t":"J'ai, tu as, il a"},{"b":"A1-A2","c":[17],"t":"Mon fils a trois ans"},{"b":"A1-A2","c":[26],"t":"C'est un homme. Il est grand"}],"x":"Ch. 19 — J'ai, tu as, il a... (avoir au présent); Ch. 17 — Mon fils a trois ans (âge); Ch. 26 — C'est un homme. Il est grand... (c'est/il est). Do selected exercises."},{"d":3,"w":1,"k":"n","e":[{"b":"A1-A2","c":[10],"t":"Un homme, une femme"},{"b":"A1-A2","c":[12],"t":"Une tour, un pont"}],"x":"Ch. 10 — Un homme, une femme... (noun gender); Ch. 12 — Une tour, un pont... (un/une/des, le/la/les). Do both article exercises."},{"d":4,"w":1,"k":"n","e":[{"b":"A1-A2","c":[6],"t":"Je parle, je regarde, j'aime"},{"b":"A1-A2","c":[7],"t":"Je parle, tu parles"}],"x":"Ch. 6 — Je parle, je regarde, j'aime... + Ch. 7 — Je parle, tu parles... (regular -er present). Focus on conjugation exercises."},{"d":5,"w":1,"k":"n","e":[{"b":"A1-A2","c":[22],"t":"En France, à Paris"}],"x":"Ch. 22 — En France, à Paris... (à/au/en + city or country). Do the destination/preposition exercise."},{"d":6,"w":1,"k":"n","e":[{"b":"A1-A2","c":[5],"t":"Est-ce que vous êtes japonais ?"}],"x":"Ch. 5 — Est-ce que vous êtes japonais ? (simple questions and ne...pas). Complete both question/negation exercises."},{"d":7,"w":1,"k":"r","e":[],"x":"Review Ch. 1, 4–7, 10, 12, 17, 19, 22 and 26. Redo marked exercises; update the error log."},{"d":8,"w":2,"k":"n","e":[{"b":"A1-A2","c":[11],"t":"Des arbres"},{"b":"A1-A2","c":[12],"t":"articles"},{"b":"A1-A2","c":[25],"t":"/26 — one short c'est/ce sont identification item"}],"x":"Ch. 11 — Des arbres... (singular/plural nouns); Ch. 12 — articles; Ch. 25/26 — one short c'est/ce sont identification item."},{"d":9,"w":2,"k":"n","e":[{"b":"A1-A2","c":[14],"t":"Mon père, ton père"}],"x":"Ch. 14 — Mon père, ton père... (possessive adjectives). Complete the choose-the-form exercise."},{"d":10,"w":2,"k":"n","e":[{"b":"A1-A2","c":[2],"t":"Il est grand. Elle est grande"},{"b":"A1-A2","c":[3],"t":"Ils sont grands"}],"x":"Ch. 2 — Il est grand. Elle est grande... (masc./fem. adjectives); Ch. 3 — Ils sont grands... (sing./plur.). Do both agreement exercises."},{"d":11,"w":2,"k":"n","e":[{"b":"A1-A2","c":[2,3],"t":"adjective agreement"}],"x":"Ch. 2–3 — adjective agreement (masc./fem.; sing./plur.). Use the book's exercises with colour/clothing vocabulary."},{"d":12,"w":2,"k":"n","e":[{"b":"A1-A2","c":[23],"t":"Dans la voiture"},{"b":"A1-A2","c":[24],"t":"Au bord de l'eau"}],"x":"Ch. 23 — Dans la voiture... (spatial prepositions); Ch. 24 — Au bord de l'eau... (il y a). Do both exercises."},{"d":13,"w":2,"k":"n","e":[{"b":"A1-A2","c":[28],"t":"Un, deux, trois"}],"x":"Ch. 28 — Un, deux, trois... (numbers, date and day). Do number dictation, number-to-word and date exercises; no time practice yet."},{"d":14,"w":2,"k":"r","e":[],"x":"Review Ch. 2, 3, 10–12, 14, 23, 24 and 28. Redo marked exercises and update the error table."},{"d":15,"w":3,"k":"n","e":[{"b":"A1-A2","c":[29],"t":"Il est cinq heures"},{"b":"A1-A2","c":[28],"t":"for days/date. Do clock-reading and schedule exercises"}],"x":"Ch. 29 — Il est cinq heures... (telling time); review Ch. 28 for days/date. Do clock-reading and schedule exercises."},{"d":16,"w":3,"k":"n","e":[{"b":"A1-A2","c":[41],"t":"Je fais du tennis"}],"x":"Ch. 41 — Je fais du tennis... (faire + activities). Complete the conjugation and activity-expression exercises."},{"d":17,"w":3,"k":"n","e":[{"b":"A1-A2","c":[7],"t":"regular -er present"},{"b":"A1-A2","c":[8],"t":"J'achète, je préfère"},{"b":"A1-A2","c":[8],"t":"only for commencer"}],"x":"Ch. 7 — regular -er present; Ch. 8 — J'achète, je préfère... (spelling changes). Use Ch. 8 only for commencer."},{"d":18,"w":3,"k":"n","e":[{"b":"A1-A2","c":[9],"t":"Je me lave. Je me regarde"}],"x":"Ch. 9 — Je me lave. Je me regarde. (pronominal -er verbs). Complete pronoun-placement and conjugation exercises."},{"d":19,"w":3,"k":"n","e":[{"b":"A1-A2","c":[6],"t":"aimer"},{"b":"A1-A2","c":[12],"t":"definite articles for general preferences. Do selected exercises"}],"x":"Ch. 6 — aimer (likes/dislikes); Ch. 12 — definite articles for general preferences. Do selected exercises."},{"d":20,"w":3,"k":"n","e":[{"b":"A1-A2","c":[51],"t":"Où ? Quand ? Comment ?"},{"b":"A1-A2","c":[25],"t":"Qui est-ce ? / Qu'est-ce que c'est ? Do selected exercises"}],"x":"Ch. 51 — Où ? Quand ? Comment ?... (question words); Ch. 25 — Qui est-ce ? / Qu'est-ce que c'est ? Do selected exercises."},{"d":21,"w":3,"k":"r","e":[],"x":"Review Ch. 6–9, 25, 28–29, 41 and 51. Redo marked exercises; record five priority errors."},{"d":22,"w":4,"k":"n","e":[{"b":"A1-A2","c":[31],"t":"Je mange de la salade"}],"x":"Ch. 31 — Je mange de la salade... (partitive articles). Complete the article-selection exercises."},{"d":23,"w":4,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir ! Je peux partir ?"}],"x":"Ch. 40 — Je veux partir ! Je peux partir ?... (vouloir/pouvoir; je voudrais as a polite chunk). Do the request/dialogue exercise."},{"d":24,"w":4,"k":"n","e":[{"b":"A1-A2","c":[32],"t":"Un litre de lait"},{"b":"A1-A2","c":[28],"t":"/51 for numbers, money and combien"}],"x":"Ch. 32 — Un litre de lait... (quantity + de); review Ch. 28/51 for numbers, money and combien. Complete shopping/price exercises."},{"d":25,"w":4,"k":"n","e":[{"b":"A1-A2","c":[20],"t":"Je n'ai pas"},{"b":"A1-A2","c":[31],"t":"for negative partitifs. Transform the food sentences"}],"x":"Ch. 20 — Je n'ai pas... (pas le/la/les; pas de); review Ch. 31 for negative partitifs. Transform the food sentences."},{"d":26,"w":4,"k":"n","e":[{"b":"A1-A2","c":[39],"t":"Je bois, vous buvez"}],"x":"Ch. 39 — Je bois, vous buvez... (irregular verbs, including prendre). Complete the prendre/meal-collocation exercises."},{"d":27,"w":4,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"vouloir/pouvoir"},{"b":"A1-A2","c":[39],"t":"prendre"}],"x":"Ch. 40 (vouloir/pouvoir) + Ch. 39 (prendre); use the book's Activités communicatives dialogues for the restaurant role-play."},{"d":28,"w":4,"k":"r","e":[],"x":"Review Ch. 20, 28, 31, 32, 39 and 40. Redo marked exercises and take a 20-item food/transaction test."},{"d":29,"w":5,"k":"n","e":[{"b":"A1-A2","c":[42],"t":"Je vais à Rome"},{"b":"A1-A2","c":[13],"t":"Je visite le Louvre"}],"x":"Ch. 42 — Je vais à Rome... (aller au présent) + Ch. 13 — Je visite le Louvre... (à la/au/aux). Do both selected exercises."},{"d":30,"w":5,"k":"n","e":[{"b":"A1-A2","c":[21],"t":"localisation"},{"b":"A1-A2","c":[23],"t":"spatial prepositions. Use Activités communicatives for route dialogue"}],"x":"Ch. 21 — localisation (à/de/chez/près de/loin de) + Ch. 23 — spatial prepositions. Use Activités communicatives for route dialogue."},{"d":31,"w":5,"k":"n","e":[{"b":"A1-A2","c":[43],"t":"Je vais manger"}],"x":"Ch. 43 — Je vais manger... (futur proche: aller + infinitive). Complete formation and present-to-future transformation exercises."},{"d":32,"w":5,"k":"n","e":[{"b":"A1-A2","c":[30],"t":"Il fait froid, en hiver"}],"x":"Ch. 30 — Il fait froid, en hiver... (weather, months/seasons). Use weather expressions to choose activities."},{"d":33,"w":5,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir ! Je peux partir ?"}],"x":"Ch. 40 — Je veux partir ! Je peux partir ?... (vouloir/pouvoir); use Activités communicatives dialogues for invitations and accepting/refusing."},{"d":34,"w":5,"k":"n","e":[{"b":"A1-A2","c":[1,14],"t":", 17, 19–26, 28–32, 39–43 and 51"}],"x":"Review/bilan: Ch. 1–14, 17, 19–26, 28–32, 39–43 and 51 (covered topics). Redo weak exercises."},{"d":35,"w":5,"k":"n","e":[{"b":"A1-A2","c":[1,14],"t":", 17, 19–26, 28–32, 39–43 and 51. Label every error by chapter/topic"}],"x":"Mixed bilan: review covered Ch. 1–14, 17, 19–26, 28–32, 39–43 and 51. Label every error by chapter/topic."},{"d":36,"w":6,"k":"n","e":[{"b":"A1-A2","c":[17],"t":"Ma fille a les yeux noirs"},{"b":"A1-A2","c":[12],"t":"Une tour, un pont"}],"x":"Ch. 17 - \"Ma fille a les yeux noirs...\" (body parts/physical description); Ch. 12 - \"Une tour, un pont...\" (le/la/les). Do the book's body-description and article exercises."},{"d":37,"w":6,"k":"n","e":[{"b":"A1-A2","c":[18],"t":"Il a mal à la tête"}],"x":"Ch. 18 - \"Il a mal à la tête...\" (pain and sensations: avoir mal, faim, froid, soif). Do the symptom and expression exercises."},{"d":38,"w":6,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir ! Je peux partir ? Je dois partir"}],"x":"Ch. 40 - \"Je veux partir ! Je peux partir ? Je dois partir...\" (pouvoir + infinitif; requests). Complete the pouvoir and \"on peut/on ne peut pas\" exercises."},{"d":39,"w":6,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir ! Je peux partir ? Je dois partir"}],"x":"Ch. 40 - \"Je veux partir ! Je peux partir ? Je dois partir...\" (devoir + infinitif; obligation/advice). Complete the devoir and \"on doit/il faut\" exercises."},{"d":40,"w":6,"k":"n","e":[{"b":"A1-A2","c":[39],"t":"Je bois, vous buvez"},{"b":"A1-A2","c":[21],"t":"Dino est de Rome"},{"b":"A1-A2","c":[28],"t":"/29 - date/time"}],"x":"Ch. 39 - \"Je bois, vous buvez...\" (venir/tenir and irregular present verbs); Ch. 21 - \"Dino est de Rome...\" (venir de + place); Ch. 28/29 - date/time. Use the appointment dialogue."},{"d":41,"w":6,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir"},{"b":"A1-A2","c":[53],"t":"ne...jamais. Do the obligation and adverb-placement exercises"}],"x":"Ch. 40 - \"Je veux partir...\" (il faut = on doit); Annexes §1-2 - adverbs/placement; Ch. 53 - ne...jamais. Do the obligation and adverb-placement exercises."},{"d":42,"w":6,"k":"r","e":[],"x":"Review Ch. 12, 17-18, 21, 28-29, 39-40 and Annexes §1-2. Redo the matching exercises; label errors by chapter."},{"d":43,"w":7,"k":"n","e":[{"b":"A1-A2","c":[13],"t":"Je visite le Louvre"}],"x":"Ch. 13 - \"Je visite le Louvre...\" (à la/au/aux; de la/du/des). Complete the contracted-article exercises with town places."},{"d":44,"w":7,"k":"n","e":[{"b":"A1-A2","c":[39],"t":"Je bois, vous buvez"},{"b":"A1-A2","c":[42],"t":"Je vais à Rome"}],"x":"Ch. 39 - \"Je bois, vous buvez...\" (prendre + transport); Ch. 42 - \"Je vais à Rome...\" (aller + en/à transport). Do both transport exercises."},{"d":45,"w":7,"k":"r","e":[],"x":"No numbered chapter - Annexes §5, \"L'impératif\" (p. 153); use \"Demande de renseignements\" for allez/tournez/dépêchez-vous instructions."},{"d":46,"w":7,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir"}],"x":"Ch. 40 - \"Je veux partir...\" (vouloir/pouvoir/devoir + infinitif); Activités communicatives, \"Au téléphone\". Complete the formal request/invitation dialogue."},{"d":47,"w":7,"k":"n","e":[{"b":"A1-A2","c":[33],"t":"Plus grand que"}],"x":"Ch. 33 - \"Plus grand que...\" (plus/moins/aussi + adjective + que). Do the quality-comparison exercises."},{"d":48,"w":7,"k":"n","e":[{"b":"A1-A2","c":[5],"t":"Est-ce que vous êtes japonais ?"},{"b":"A1-A2","c":[51],"t":"Où ? Quand ? Comment ?"}],"x":"Ch. 5 - \"Est-ce que vous êtes japonais ?\" (simple questions); Ch. 51 - \"Où ? Quand ? Comment ?...\" (question words + inversion). Do both question-form exercises."},{"d":49,"w":7,"k":"r","e":[],"x":"Review Ch. 5, 13, 33, 39-40, 42, 51 and Annexes §5. Redo one exercise for each Kwiziq pattern; update the error log."},{"d":50,"w":8,"k":"n","e":[{"b":"A1-A2","c":[44],"t":"J'ai mangé, tu as mangé"}],"x":"Ch. 44 - \"J'ai mangé, tu as mangé...\" (passé composé with avoir, -er verbs). Complete formation and present-to-past transformation exercises."},{"d":51,"w":8,"k":"n","e":[{"b":"A1-A2","c":[45],"t":"J'ai vu, j'ai mis, j'ai fait"}],"x":"Ch. 45 - \"J'ai vu, j'ai mis, j'ai fait...\" (passé composé with avoir, -ir/-re/-oir verbs). Complete the irregular past-participle exercises."},{"d":52,"w":8,"k":"n","e":[{"b":"A1-A2","c":[54],"t":"Il n'a pas mangé. Il n'est pas sorti"}],"x":"Ch. 54 - \"Il n'a pas mangé. Il n'est pas sorti.\" (negation with passé composé). Complete the negative-sentence exercise."},{"d":53,"w":8,"k":"n","e":[{"b":"A1-A2","c":[54],"t":"negation and questions in passé composé"},{"b":"A1-A2","c":[5],"t":"/51 for est-ce que/inversion. Transform answers into past questions"}],"x":"Ch. 54 - negation and questions in passé composé; Ch. 5/51 for est-ce que/inversion. Transform answers into past questions."},{"d":54,"w":8,"k":"n","e":[{"b":"A1-A2","c":[44,46],"t":"passé composé with avoir and être"},{"b":"A1-A2","c":[49],"t":"sequence of past events. Use \"Dîner chez les Simon\" for puis/après/ensuite narrative pract"}],"x":"Ch. 44-46 - passé composé with avoir and être; Ch. 49 - sequence of past events. Use \"Dîner chez les Simon\" for puis/après/ensuite narrative practice."},{"d":55,"w":8,"k":"n","e":[{"b":"A1-A2","c":[49],"t":"Je mange, j'ai mangé"}],"x":"Ch. 49 - \"Je mange, j'ai mangé...\" (present/past/future summary); use the summary narrative exercise to identify present vs passé composé."},{"d":56,"w":8,"k":"r","e":[],"x":"Review Ch. 44-46, 49 and 54. Redo regular/irregular/être and negation-question exercises; update the auxiliary chart."},{"d":57,"w":9,"k":"n","e":[{"b":"A1-A2","c":[43],"t":"Je vais manger"},{"b":"A1-A2","c":[50],"t":"Il y a deux ans"}],"x":"Ch. 43 - \"Je vais manger...\" (futur proche); Ch. 50 - \"Il y a deux ans...\" (dans + future time). Complete plan and time-expression exercises."},{"d":58,"w":9,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir"}],"x":"Ch. 40 - \"Je veux partir...\" (vouloir/pouvoir/devoir + infinitif); Activités communicatives, \"Au téléphone\". Practice je voudrais/je peux/je dois requests."},{"d":59,"w":9,"k":"n","e":[{"b":"A1-A2","c":[24],"t":"Au bord de l'eau, il y a"},{"b":"A1-A2","c":[40],"t":"pouvoir"}],"x":"Ch. 24 - \"Au bord de l'eau, il y a...\" (il y a/il n'y a pas); Ch. 40 - pouvoir. Complete existence/negation and ability exercises."},{"d":60,"w":9,"k":"n","e":[{"b":"A1-A2","c":[29],"t":"Il est cinq heures"},{"b":"A1-A2","c":[36],"t":"Je pars, vous partez"}],"x":"Ch. 29 - \"Il est cinq heures\" (time/schedules); Ch. 36 - \"Je pars, vous partez\" (partir present). Read a timetable and answer departure/arrival questions."},{"d":61,"w":9,"k":"n","e":[{"b":"A1-A2","c":[46],"t":"Il est arrivé, elle est partie"}],"x":"Ch. 46 - \"Il est arrivé, elle est partie...\" (passé composé with être; movement verbs/agreement). Complete auxiliary and agreement exercises."},{"d":62,"w":9,"k":"n","e":[{"b":"A1-A2","c":[44,46],"t":"avoir vs être in passé composé"}],"x":"Ch. 44-46 - avoir vs être in passé composé; Activités communicatives, \"Chez les Calderon\" (both auxiliaries). Sort verbs and retell the story."},{"d":63,"w":9,"k":"r","e":[],"x":"Review Ch. 40, 43-46, 49-50. Redo the travel/request exercises; correct the avoir/être chart and label each Kwiziq error."},{"d":64,"w":10,"k":"n","e":[{"b":"A1-A2","c":[1],"t":"Vous êtes japonais ?"},{"b":"A1-A2","c":[26],"t":"C'est un homme. Il est grand"},{"b":"A1-A2","c":[12],"t":"for articles. Do the contrast exercise"}],"x":"Ch. 1 - \"Vous êtes japonais ?\" (professions after être); Ch. 26 - \"C'est un homme. Il est grand.\" (c'est + noun vs il/elle est); Ch. 12 for articles. Do the contrast exercise."},{"d":65,"w":10,"k":"n","e":[{"b":"A1-A2","c":[38],"t":"Je sais. Je connais"},{"b":"A1-A2","c":[40],"t":"pouvoir"}],"x":"Ch. 38 - \"Je sais. Je connais...\" (savoir vs connaître); Ch. 40 - pouvoir + infinitif. Complete both ability/knowledge exercises."},{"d":66,"w":10,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir"}],"x":"Ch. 40 - \"Je veux partir...\" (devoir/pouvoir/il faut + infinitif). Complete the \"on peut/on doit\" rules exercise."},{"d":67,"w":10,"k":"n","e":[{"b":"A1-A2","c":[49],"t":"present/past/future summary"},{"b":"A1-A2","c":[43,46],"t":"Write one status update using present, passé composé and futur proche, then check each t"}],"x":"Ch. 49 - present/past/future summary; review Ch. 43-46. Write one status update using present, passé composé and futur proche, then check each tense."},{"d":68,"w":10,"k":"n","e":[{"b":"A1-A2","c":[1],"t":"Vous êtes japonais ?"}],"x":"Ch. 1 - \"Vous êtes japonais ?\" (tu/vous, nous/on); no numbered email chapter. Use Activités communicatives for formal/informal formulas and rewrite one message."},{"d":69,"w":10,"k":"n","e":[{"b":"A1-A2","c":[50],"t":"Il y a deux ans, pendant deux ans, depuis deux ans"}],"x":"Ch. 50 - \"Il y a deux ans, pendant deux ans, depuis deux ans...\" (depuis + present; duration expressions). Complete depuis/pendant/dans/en exercises."},{"d":70,"w":10,"k":"n","e":[{"b":"A1-A2","c":[49],"t":") - present/future/past review"},{"b":"A1-A2","c":[43,46],"t":"and"},{"b":"A1-A2","c":[50],"t":null}],"x":"Bilan n° 6 (after Ch. 49) - present/future/past review; review Ch. 43-46 and Ch. 50. Complete the cumulative mixed exercise and log weak topics."},{"d":71,"w":11,"k":"n","e":[{"b":"A1-A2","c":[15],"t":"Ce chat, cette voiture, ces arbres"},{"b":"A1-A2","c":[2,3],"t":"adjective gender/number agreement"}],"x":"Ch. 15 - \"Ce chat, cette voiture, ces arbres\" (ce/cet/cette/ces); Ch. 2-3 (adjective gender/number agreement). Do the demonstrative-choice and feminine/plural exercises with clothing nouns."},{"d":72,"w":11,"k":"n","e":[{"b":"A1-A2","c":[16],"t":"J'ai une voiture. Vous avez une belle voiture"}],"x":"Ch. 16 - \"J'ai une voiture. Vous avez une belle voiture.\" (place of the adjective). Do the before/after-noun and object-description exercises."},{"d":73,"w":11,"k":"n","e":[{"b":"A1-A2","c":[33],"t":"Plus grand que"}],"x":"Ch. 33 - \"Plus grand que...\" (plus/moins/aussi + adjective + que; superlative le plus/le moins). Do the product-comparison and superlative exercises."},{"d":74,"w":11,"k":"n","e":[{"b":"A1-A2","c":[57],"t":"Il le regarde, il la regarde, il les regarde"}],"x":"Ch. 57 - \"Il le regarde, il la regarde, il les regarde\" (direct-object pronouns le/la/les). Replace repeated nouns and complete the pronoun-placement exercises."},{"d":75,"w":11,"k":"n","e":[{"b":"A1-A2","c":[44,46],"t":"passé composé"},{"b":"A1-A2","c":[40],"t":"Je veux partir"}],"x":"Ch. 44-46 - passé composé (avoir/être); Ch. 40 - \"Je veux partir...\" (vouloir/pouvoir/devoir + infinitif). Combine the past transformation and polite-request exercises."},{"d":76,"w":11,"k":"n","e":[{"b":"A1-A2","c":[60],"t":"L'homme qui passe... L'homme que je regarde"}],"x":"Ch. 60 - \"L'homme qui passe... L'homme que je regarde...\" (qui/que, relatifs simples). Join short product sentences and complete the review exercise."},{"d":77,"w":11,"k":"r","e":[],"x":"Review Ch. 2-3 (agreement), Ch. 15-16 (demonstratives/adjective place), Ch. 33 (comparison), Ch. 57 (COD) and Ch. 60 (qui/que). Redo one exercise for each pattern."},{"d":78,"w":12,"k":"n","e":[{"b":"A1-A2","c":[26],"t":"C'est un homme. Il est grand"},{"b":"A1-A2","c":[2,3],"t":"agreement"}],"x":"Ch. 26 - \"C'est un homme. Il est grand.\" (c'est + noun vs il/elle est + adjective); Ch. 2-3 (agreement). Do the identification/description exercises with housing vocabulary."},{"d":79,"w":12,"k":"n","e":[{"b":"A1-A2","c":[32],"t":"Un litre de lait"}],"x":"Ch. 32 - \"Un litre de lait...\" (quantité exprimée); Activities communicatives, \"Demande de renseignements\" (questions/nombres/il y a). Do the abbreviated rental-ad transformation."},{"d":80,"w":12,"k":"n","e":[{"b":"A1-A2","c":[51],"t":"Où ? Quand ? Comment ? Combien ? Pourquoi ?"},{"b":"A1-A2","c":[52],"t":"quel/quelle/qui/que"},{"b":"A1-A2","c":[5],"t":"est-ce que"}],"x":"Ch. 51 - \"Où ? Quand ? Comment ? Combien ? Pourquoi ?\" (combien); Ch. 52 (quel/quelle/qui/que); Ch. 5 (est-ce que). Do the question-formation exercises."},{"d":81,"w":12,"k":"n","e":[{"b":"A1-A2","c":[43],"t":"Je vais manger"}],"x":"Annexes §7 - Le passé proche (venir de + infinitif); Ch. 43 - \"Je vais manger...\" (futur proche). Do both formation exercises; être en train de is an extra expression, not a numbered lesson."},{"d":82,"w":12,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir"},{"b":"A1-A2","c":[41],"t":"Je fais du tennis"}],"x":"Ch. 40 - \"Je veux partir...\" (devoir/pouvoir + infinitif); Ch. 41 - \"Je fais du tennis...\" (faire + noun phrase). The causative faire réparer is not taught as a numbered A1 lesson; keep it as an extension."},{"d":83,"w":12,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"for polite vouloir/pouvoir requests. Do the imperative transformations and request dialogu"}],"x":"Annexes §5 - L'impératif (affirmative/negative and pronoun placement); Ch. 40 for polite vouloir/pouvoir requests. Do the imperative transformations and request dialogue."},{"d":84,"w":12,"k":"r","e":[],"x":"Review Ch. 2-3 (agreement), 5 (est-ce que), 15-16 (demonstratives/adjective place), 26 (c'est/il est), 32 (quantity), 40 (modals), 43 (futur proche), 51-52 (questions) and Annexes §5/§7."},{"d":85,"w":13,"k":"n","e":[{"b":"A1-A2","c":[48],"t":"Quand je serai grand, je serai président"}],"x":"Ch. 48 - \"Quand je serai grand, je serai président\" (futur simple: regular stems and endings). Do the mettez au futur simple exercises."},{"d":86,"w":13,"k":"n","e":[{"b":"A1-A2","c":[48],"t":"Quand je serai grand"}],"x":"Ch. 48 - \"Quand je serai grand...\" (irregular future stems: être, avoir, aller, venir, faire, voir). Do the prediction and quand-sentence exercises."},{"d":87,"w":13,"k":"n","e":[{"b":"A1-A2","c":[4],"t":"Je suis, tu es, il est"},{"b":"A1-A2","c":[40],"t":"Je veux partir"}],"x":"Ch. 4 - \"Je suis, tu es, il est...\" (tu/vous, nous/on); Ch. 40 - \"Je veux partir...\" (vouloir/pouvoir/devoir + infinitif). Use the communicative activity \"Au téléphone\" for invitations."},{"d":88,"w":13,"k":"n","e":[{"b":"A1-A2","c":[49],"t":"Je mange, j'ai mangé, je vais manger"},{"b":"A1-A2","c":[43],"t":"/48"},{"b":"A1-A2","c":[51],"t":"supplies pourquoi/parce que. Donc/c'est pourquoi have no dedicated A1 chapter"}],"x":"Ch. 49 - \"Je mange, j'ai mangé, je vais manger...\" (tense contrast); Ch. 43/48 (future forms); Ch. 51 supplies pourquoi/parce que. Donc/c'est pourquoi have no dedicated A1 chapter."},{"d":89,"w":13,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"exercises include \"Si tu veux..., tu dois...\""},{"b":"A1-A2","c":[48],"t":"futur simple"}],"x":"Ch. 40 exercises include \"Si tu veux..., tu dois...\" (si + present + modal); Ch. 48 (futur simple). There is no dedicated A1 chapter for si + present + future, so practise it as an extension."},{"d":90,"w":13,"k":"n","e":[{"b":"A1-A2","c":[4],"t":"nous/on"},{"b":"A1-A2","c":[40],"t":"vouloir/pouvoir/devoir"},{"b":"A1-A2","c":[49],"t":"sequence with après"}],"x":"Ch. 4 (nous/on); Ch. 40 (vouloir/pouvoir/devoir); Ch. 49 (sequence with après). There is no dedicated negotiation chapter; use the communicative planning/request dialogue."},{"d":91,"w":13,"k":"r","e":[],"x":"Review Ch. 4 (tu/vous, nous/on), Ch. 40 (modals), Ch. 43/48/49 (future and tense contrast) and Ch. 51 (pourquoi/parce que). Redo the future and conditional exercises."},{"d":92,"w":14,"k":"n","e":[{"b":"A1-A2","c":[51],"t":"Où ? Quand ? Comment ? Combien ? Pourquoi ?"}],"x":"Ch. 51 - \"Où ? Quand ? Comment ? Combien ? Pourquoi ?\" (cause/but; the book models \"Pour voyager de nuit\"). Use the question/answer exercise to make device-purpose sentences."},{"d":93,"w":14,"k":"n","e":[{"b":"A1-A2","c":[53],"t":"Il ne dit rien. Il ne sort jamais"}],"x":"Ch. 53 - \"Il ne dit rien. Il ne sort jamais.\" (ne...rien, jamais, plus, personne). Do the negative-sentence and transformation exercises."},{"d":94,"w":14,"k":"r","e":[],"x":"Annexes §5 - L'impératif (affirmative/negative forms and pronoun placement). Do the imperative transformation exercises with tutorial instructions."},{"d":95,"w":14,"k":"n","e":[{"b":"A1-A2","c":[44,46],"t":"passé composé"},{"b":"A1-A2","c":[49],"t":"for event sequence. Do the past-report transformation exercises"}],"x":"Annexes §7 - passé proche (venir de + infinitif); Ch. 44-46 - passé composé; Ch. 49 for event sequence. Do the past-report transformation exercises."},{"d":96,"w":14,"k":"n","e":[{"b":"A1-A2","c":[38],"t":"Je sais. Je connais. Je crois. Je vois"}],"x":"Ch. 38 - \"Je sais. Je connais. Je crois. Je vois.\" (croire); use the communicative opinion activities. The book has no numbered lesson for penser que/trouver que, so practise those as an extension."},{"d":97,"w":14,"k":"r","e":[],"x":"Annexes §6 - Le discours direct et indirect (il dit que..., il demande si..., il lui dit de...). Do the direct-to-indirect message transformations."},{"d":98,"w":14,"k":"r","e":[],"x":"Review Ch. 38 (croire/opinion), Ch. 51 (pourquoi/parce que), Ch. 53 (negation), and Annexes §5-7 (imperative, indirect speech, recent past). Redo the weak exercises."},{"d":99,"w":15,"k":"n","e":[{"b":"A1-A2","c":[38],"t":"Je sais. Je connais. Je crois. Je vois"}],"x":"Ch. 38 - \"Je sais. Je connais. Je crois. Je vois.\" (croire); use the book's opinion/commentary activities. There is no numbered lesson for penser que/trouver que; practise those as an extension."},{"d":100,"w":15,"k":"n","e":[{"b":"A1-A2","c":[27],"t":"C'est beau ! C'est cher !"}],"x":"Ch. 27 - \"C'est beau ! C'est cher !\" (commentaire/opinion; agreement or disagreement). There is no numbered A1 lesson for moi aussi/moi non plus/si; practise these as an extension."},{"d":101,"w":15,"k":"n","e":[{"b":"A1-A2","c":[51],"t":"Pourquoi ? ... Parce que"},{"b":"A1-A2","c":[27],"t":"comments and opinions. The book has no dedicated chapter for car, donc or c'est pourquoi"}],"x":"Ch. 51 - \"Pourquoi ? ... Parce que\" (reason); Ch. 27 - comments and opinions. The book has no dedicated chapter for car, donc or c'est pourquoi; add them as connector extensions."},{"d":102,"w":15,"k":"n","e":[{"b":"A1-A2","c":[27],"t":"C'est beau ! C'est cher !"},{"b":"A1-A2","c":[51],"t":"pourquoi/parce que, reasons"}],"x":"Ch. 27 - \"C'est beau ! C'est cher !\" (opinions/comments); Ch. 51 (pourquoi/parce que, reasons). There is no dedicated A1 chapter for d'un côté/de l'autre or pourtant; practise them as extensions."},{"d":103,"w":15,"k":"n","e":[{"b":"A1-A2","c":[27],"t":"opinion"},{"b":"A1-A2","c":[51],"t":"reason/purpose"},{"b":"A1-A2","c":[33],"t":"comparisons"},{"b":"A1-A2","c":[49],"t":"tense choice"}],"x":"Production review: Ch. 27 (opinion), Ch. 51 (reason/purpose), Ch. 33 (comparisons) and Ch. 49 (tense choice). Use free production; no single A1 chapter covers the four-part answer frame."},{"d":104,"w":15,"k":"n","e":[{"b":"A1-A2","c":[49],"t":"present/past/future"},{"b":"A1-A2","c":[33],"t":"comparison"},{"b":"A1-A2","c":[51],"t":"reasons/questions"}],"x":"Bilan n° 6 + Ch. 49 (present/past/future); Bilan n° 8 (pronouns/relatives); Ch. 33 (comparison) and Ch. 51 (reasons/questions). Complete selected exercises from each weak area."},{"d":105,"w":15,"k":"r","e":[],"x":"Test d'évaluation (end of book) + Bilan n° 6 (tenses) and Bilan n° 8 (pronouns/relatives). No new chapter: classify errors by the exact chapter/topic and set the next priorities."},{"d":106,"w":16,"k":"n","e":[{"b":"A1-A2","c":[47],"t":"Quand j'étais petit, j'avais un chien"}],"x":"Ch. 47 - \"Quand j'étais petit, j'avais un chien...\" (L'imparfait: stem and endings). Do \"Mettez à l'imparfait\" and \"Complétez avec les finales de l'imparfait\"."},{"d":107,"w":16,"k":"n","e":[{"b":"A1-A2","c":[47],"t":"Quand j'étais petit, j'avais un chien"}],"x":"Ch. 47 - \"Quand j'étais petit, j'avais un chien...\" (past habits, Avant/Maintenant). Do \"Complétez les phrases: Quand j'étais petit...\" and compare the old and current routines."},{"d":108,"w":16,"k":"n","e":[{"b":"A1-A2","c":[47],"t":"Quand j'étais petit, j'avais un chien"}],"x":"Ch. 47 - \"Quand j'étais petit, j'avais un chien...\" (imparfait for descriptions, weather, time and il y avait). Do \"Il y a / Il y avait\" and the setting-description exercises."},{"d":109,"w":16,"k":"n","e":[{"b":"A1-A2","c":[49],"t":"Je mange, j'ai mangé, je vais manger, je mangeais, je mangerai"}],"x":"Ch. 49 - \"Je mange, j'ai mangé, je vais manger, je mangeais, je mangerai\" (passé composé event vs imparfait background). Do \"Le passé composé et l'imparfait. Décrivez, racontez\" and justify each tense."},{"d":110,"w":16,"k":"n","e":[{"b":"A1-A2","c":[49],"t":"Je mange, j'ai mangé, je vais manger, je mangeais, je mangerai"}],"x":"Ch. 49 - \"Je mange, j'ai mangé, je vais manger, je mangeais, je mangerai\" (event sequence vs background). Do the narrative tense-gap and \"Décrivez, racontez\" exercises, then write a short anecdote."},{"d":111,"w":16,"k":"n","e":[{"b":"A1-A2","c":[47],"t":"imparfait forms"},{"b":"A1-A2","c":[51],"t":"Où ? Quand ? Comment ? Combien ? Pourquoi ?"},{"b":"A1-A2","c":[52],"t":"Qui habite ici ? Qu'est-ce qu'il fait ? Quelle est sa profession ?"}],"x":"Ch. 47 (imparfait forms); Ch. 51 - \"Où ? Quand ? Comment ? Combien ? Pourquoi ?\" (où/comment); Ch. 52 - \"Qui habite ici ? Qu'est-ce qu'il fait ? Quelle est sa profession ?\" (qu'est-ce que). Do the question-formation exercises and answer in the imparfait."},{"d":112,"w":16,"k":"n","e":[{"b":"A1-A2","c":[47],"t":"and"},{"b":"A1-A2","c":[49],"t":"imparfait, passé composé and tense choice"}],"x":"Bilan n° 6 + Ch. 47 and Ch. 49 (imparfait, passé composé and tense choice). Complete the mixed tense exercises and keep an error log."},{"d":113,"w":17,"k":"n","e":[{"b":"A1-A2","c":[14],"t":"Mon père, ton père, son père... Ma mère, ta mère, sa mère"},{"b":"A1-A2","c":[15],"t":"Ce chat, cette voiture, ces arbres"}],"x":"Ch. 14 - \"Mon père, ton père, son père... Ma mère, ta mère, sa mère...\" (possessive adjectives); Ch. 15 - \"Ce chat, cette voiture, ces arbres\" (demonstratives). Do the mon/ma/mes, son/sa/ses and ce/cette/ces form-field exercises."},{"d":114,"w":17,"k":"n","e":[{"b":"A1-A2","c":[50],"t":"Il y a deux ans, pendant deux ans, depuis deux ans, dans deux ans"}],"x":"Ch. 50 - \"Il y a deux ans, pendant deux ans, depuis deux ans, dans deux ans\" (depuis/pendant/il y a/dans, also en). Do its preposition-selection exercises. Important: the book rejects \"pour\" for ongoing or finished duration, so treat that Kwiziq item as an extension."},{"d":115,"w":17,"k":"n","e":[{"b":"A1-A2","c":[51,52],"t":"for où/quand/qui/que. Do the direct-to-indirect question transformations"}],"x":"Annex 6 - \"Le discours direct et indirect\" (il demande si..., il demande ce que...); Ch. 51-52 for où/quand/qui/que. Do the direct-to-indirect question transformations; add je voudrais savoir as a polite frame."},{"d":116,"w":17,"k":"n","e":[{"b":"A1-A2","c":[51],"t":"Où ? Quand ? Comment ? Combien ? Pourquoi ?"}],"x":"Ch. 51 - \"Où ? Quand ? Comment ? Combien ? Pourquoi ?\" (pourquoi/parce que, cause and purpose). Do the question/answer exercises; practise à cause de, donc and similar connectors as extensions because they have no dedicated A1 chapter."},{"d":117,"w":17,"k":"n","e":[{"b":"A1-A2","c":[55],"t":"Elle mange du poisson ? - Oui, elle en mange"}],"x":"Ch. 55 - \"Elle mange du poisson ? - Oui, elle en mange\" (en for de-phrases and quantities); Annex 4 - \"Place du pronom complément\". Do the en-replacement and quantity-response exercises, then place en correctly in each procedure step."},{"d":118,"w":17,"k":"n","e":[{"b":"A1-A2","c":[57],"t":"Il le regarde, il la regarde, il les regarde"},{"b":"A1-A2","c":[55],"t":"Elle mange du poisson ? - Oui, elle en mange"}],"x":"Ch. 57 - \"Il le regarde, il la regarde, il les regarde\" (le/la/les); Ch. 55 - \"Elle mange du poisson ? - Oui, elle en mange\" (en); Annex 4 for pronoun placement. Complete the formal telephone follow-up dialogue with these pronouns."},{"d":119,"w":17,"k":"r","e":[],"x":"Review Ch. 50 (time), Ch. 51-52 and Annex 6 (questions and indirect questions), Ch. 55 and Ch. 57 (en and direct objects). Use the relevant recap exercises and Bilan n° 7 time/question items, then complete the five-error correction table."},{"d":120,"w":18,"k":"n","e":[{"b":"A1-A2","c":[2],"t":"Il est grand. Elle est grande"},{"b":"A1-A2","c":[3],"t":"Ils sont grands. Elles sont grandes"}],"x":"Ch. 2 - \"Il est grand. Elle est grande\" (adjective gender); Ch. 3 - \"Ils sont grands. Elles sont grandes\" (adjective number). Do the masculine/feminine and singular/plural agreement exercises with personality traits."},{"d":121,"w":18,"k":"n","e":[{"b":"A1-A2","c":[18],"t":"Il a mal à la tête. Il a mal au dos. Ils ont faim. Ils ont froid"},{"b":"A1-A2","c":[2,3],"t":"for adjective agreement. The book has"}],"x":"Ch. 18 - \"Il a mal à la tête. Il a mal au dos. Ils ont faim. Ils ont froid\" (avoir expressions, including avoir peur de); Ch. 2-3 for adjective agreement. The book has no numbered lesson for se sentir or rendre + adjective, so practise those as extensions."},{"d":122,"w":18,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir ! Je peux partir ? Je dois partir"}],"x":"Ch. 40 - \"Je veux partir ! Je peux partir ? Je dois partir...\" (vouloir/pouvoir/devoir + infinitif, base for advice). Do the on peut/on doit/il faut exercises, then reformulate as tu devrais or vous devriez; the conditional is an extension, not a numbered A1 lesson."},{"d":123,"w":18,"k":"n","e":[{"b":"A1-A2","c":[44,47],"t":"passé composé and imparfait for the explanation"},{"b":"A1-A2","c":[40],"t":"Je veux partir"},{"b":"A1-A2","c":[43],"t":"Je vais manger, tu vas manger"}],"x":"Ch. 44-47 (passé composé and imparfait for the explanation); Ch. 40 - \"Je veux partir...\" (devoir/pouvoir/vouloir + infinitif); Ch. 43 - \"Je vais manger, tu vas manger\" (repair offer). Conditional forms such as j'aurais dû are extensions; order apology, reason and repair."},{"d":124,"w":18,"k":"n","e":[{"b":"A1-A2","c":[55],"t":"Elle mange du poisson ? - Oui, elle en mange"},{"b":"A1-A2","c":[56],"t":"Je vais au cinéma. J'y vais à six heures"}],"x":"Ch. 55 - \"Elle mange du poisson ? - Oui, elle en mange\" (quantity); Ch. 56 - \"Je vais au cinéma. J'y vais à six heures\" (place); Annex 4 for pronoun placement. Do the en and y transformation exercises, then use both in the hosting dialogues."},{"d":125,"w":18,"k":"n","e":[{"b":"A1-A2","c":[27],"t":"C'est beau ! C'est cher !"},{"b":"A1-A2","c":[51],"t":"for pourquoi/parce que"}],"x":"Ch. 27 - \"C'est beau ! C'est cher !\" (commentaire général, opinion and reaction); Ch. 51 for pourquoi/parce que. There is no dedicated A1 chapter for même si or pourtant, so add concession as an extension to the opinion exercises."},{"d":126,"w":18,"k":"r","e":[],"x":"Review Ch. 2-3 (agreement), Ch. 18 (avoir peur and expressions), Ch. 27 (comments), Ch. 40 (advice base), Ch. 43-47 (past forms) and Ch. 55-56 (en/y). Complete the relevant recap exercises and Bilan n° 8 pronoun work; conditional/concession remain extensions."},{"d":127,"w":19,"k":"n","e":[{"b":"A1-A2","c":[60],"t":"L'homme qui passe... L'homme que je regarde"}],"x":"Ch. 60 - \"L'homme qui passe... L'homme que je regarde\" (qui/que, relatifs simples). Do the sentence-joining exercises; the relative où has no separate numbered A1 lesson, so practise it as an extension."},{"d":128,"w":19,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir ! Je peux partir ? Je dois partir"}],"x":"Ch. 40 - \"Je veux partir ! Je peux partir ? Je dois partir...\" (il faut = on doit, necessity); Annex 5 - \"L'impératif\" (affirmative/negative forms and pronoun placement). Do the on doit/il faut exercises, then write negative recycling rules."},{"d":129,"w":19,"k":"n","e":[{"b":"A1-A2","c":[41],"t":"Je fais du tennis. Tu fais la cuisine"},{"b":"A1-A2","c":[40],"t":"supplies the A1 infinitive pattern. Faire"}],"x":"Ch. 41 - \"Je fais du tennis. Tu fais la cuisine\" (faire + activity); Ch. 40 supplies the A1 infinitive pattern. Faire + infinitif causatif and laisser + infinitif have no numbered A1 lesson, so use the action/result exercise as a controlled extension."},{"d":130,"w":19,"k":"n","e":[{"b":"A1-A2","c":[33],"t":"Plus grand que... Moins grand que... Aussi grand que"},{"b":"A1-A2","c":[34],"t":"Plus (de), moins (de), autant (de)"}],"x":"Ch. 33 - \"Plus grand que... Moins grand que... Aussi grand que...\" (quality comparison); Ch. 34 - \"Plus (de), moins (de), autant (de)\" (La comparaison de quantités). Do both comparison exercises with the transport table."},{"d":131,"w":19,"k":"n","e":[{"b":"A1-A2","c":[44,46],"t":"passé composé for reports"},{"b":"A1-A2","c":[48],"t":"Quand je serai grand, je serai président"}],"x":"Ch. 44-46 (passé composé for reports); Ch. 48 - \"Quand je serai grand, je serai président\" (futur simple, including irregular stems). Do the past/future transformation exercises, then link forecast, preparation and result."},{"d":132,"w":19,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir ! Je peux partir ? Je dois partir"},{"b":"A1-A2","c":[48],"t":"Quand je serai grand"}],"x":"Ch. 40 - \"Je veux partir ! Je peux partir ? Je dois partir...\" (pouvoir/devoir + infinitif, base for on peut); Ch. 48 - \"Quand je serai grand...\" (future benefit). On pourrait, cela permettrait and similar conditional forms are extensions; use the modal/future exercises before writing the proposal."},{"d":133,"w":19,"k":"r","e":[],"x":"Review Ch. 33-34 (comparisons and quantities), Ch. 40 (il faut/on doit), Annex 5 (imperative), Ch. 48 (future) and Ch. 60 (qui/que; où as an extension). Complete the recap exercises and priority error review; conditional suggestions remain an extension."},{"d":134,"w":20,"k":"n","e":[{"b":"A1-A2","c":[47,49],"t":"imparfait, passé composé and tense contrast"},{"b":"A1-A2","c":[49],"t":"Je mange, j'ai mangé, je vais manger, je mangeais, je mangerai"}],"x":"Ch. 47-49 (imparfait, passé composé and tense contrast); Ch. 49 - \"Je mange, j'ai mangé, je vais manger, je mangeais, je mangerai\". Do \"Le passé composé et l'imparfait. Décrivez, racontez\"; narrative connectors are production extensions."},{"d":135,"w":20,"k":"n","e":[{"b":"A1-A2","c":[4],"t":"Je suis, tu es, il est"},{"b":"A1-A2","c":[40],"t":"Je veux partir"}],"x":"Ch. 4 - \"Je suis, tu es, il est...\" (on as a subject); Ch. 40 - \"Je veux partir...\" (il faut/on doit); Annex 5 - \"L'impératif\". The passive-like on construction and sequence markers have no separate A1 lesson; build the process from necessity and imperative exercises."},{"d":136,"w":20,"k":"n","e":[{"b":"A1-A2","c":[34],"t":"Plus (de), moins (de), autant (de)"},{"b":"A1-A2","c":[33],"t":"Plus grand que"}],"x":"Ch. 34 - \"Plus (de), moins (de), autant (de)\" (La comparaison de quantités; Le superlatif); Ch. 33 - \"Plus grand que...\" (quality comparison). Do the quantity, comparison and superlative exercises, then write the recommendation."},{"d":137,"w":20,"k":"n","e":[{"b":"A1-A2","c":[40],"t":"Je veux partir"},{"b":"A1-A2","c":[51],"t":"Où ? Quand ? Comment ? Combien ? Pourquoi ?"},{"b":"A1-A2","c":[48],"t":"for future forms. Conditional suggestions and consequence connectors are extensions"}],"x":"Ch. 40 - \"Je veux partir...\" (pouvoir/devoir + infinitif, advice); Ch. 51 - \"Où ? Quand ? Comment ? Combien ? Pourquoi ?\" (pourquoi/parce que, cause and purpose); Ch. 48 for future forms. Conditional suggestions and consequence connectors are extensions."},{"d":138,"w":20,"k":"n","e":[{"b":"A1-A2","c":[2,3],"t":"description/agreement"},{"b":"A1-A2","c":[27],"t":"comment"},{"b":"A1-A2","c":[33,34],"t":"comparison/superlative"},{"b":"A1-A2","c":[40],"t":"advice base"},{"b":"A1-A2","c":[47,49],"t":"narration"},{"b":"A1-A2","c":[51],"t":"reasons"}],"x":"Production review: Ch. 2-3 (description/agreement), Ch. 27 (comment), Ch. 33-34 (comparison/superlative), Ch. 40 (advice base), Ch. 47-49 (narration) and Ch. 51 (reasons). Use the chapter exercises as models; connectors and conditional advice are oral extensions."},{"d":139,"w":20,"k":"n","e":[{"b":"A1-A2","c":[2,3],"t":"agreement"},{"b":"A1-A2","c":[47,49],"t":"tenses"},{"b":"A1-A2","c":[55,60],"t":"en/y, direct/indirect pronouns and qui/que"},{"b":"A1-A2","c":[51],"t":"reasons"}],"x":"Production review: Ch. 2-3 (agreement), Ch. 47-49 (tenses), Ch. 55-60 (en/y, direct/indirect pronouns and qui/que) and Ch. 51 (reasons). Use Bilan n° 6 for tenses and Bilan n° 8 for pronouns/relatives, then plan, draft, check and rewrite."},{"d":140,"w":20,"k":"r","e":[],"x":"Test d'évaluation at the end of the book + Bilan n° 6 (tenses), Bilan n° 7 (time, questions and negation) and Bilan n° 8 (pronouns/relatives). No new chapter: classify errors by exact chapter/topic and set five priorities."},{"d":141,"w":21,"k":"n","e":[{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"}],"x":"A2-B1 Ch. 35 - \"Le discours indirect au présent\" (penser/croire/trouver que and reported statements). Complete the chapter exercises on reporting statements; opinion vocabulary is a production extension."},{"d":142,"w":21,"k":"n","e":[{"b":"A2-B1","c":[18],"t":"L'adverbe"}],"x":"A2-B1 Ch. 18 - \"L'adverbe\" (function and placement). Complete the exercises on adverbs in -ment, time/place and degree."},{"d":143,"w":21,"k":"n","e":[{"b":"A2-B1","c":[33],"t":"L'interrogation (2)"},{"b":"A2-B1","c":[52],"t":"Les relations logiques"}],"x":"A2-B1 Ch. 33 - \"L'interrogation (2)\" (où, quand, comment, combien, pourquoi); Ch. 52 - \"Les relations logiques\" (cause and but). Complete the question and logic exercises."},{"d":144,"w":21,"k":"n","e":[{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"},{"b":"A2-B1","c":[52],"t":"Les relations logiques"}],"x":"A2-B1 Ch. 35 - \"Le discours indirect au présent\" (opinion and reporting); Ch. 52 - \"Les relations logiques\" (cause, opposition and concession). Complete both chapter exercises."},{"d":145,"w":21,"k":"n","e":[{"b":"A2-B1","c":[22],"t":"Le comparatif et le superlatif"},{"b":"A2-B1","c":[52],"t":"Les relations logiques"}],"x":"A2-B1 Ch. 22 - \"Le comparatif et le superlatif\"; Ch. 52 - \"Les relations logiques\" (opposition and concession). Complete the comparison and contrast exercises."},{"d":146,"w":21,"k":"n","e":[{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"},{"b":"A2-B1","c":[52],"t":"Les relations logiques"}],"x":"A2-B1 Ch. 35 - \"Le discours indirect au présent\"; Ch. 52 - \"Les relations logiques\" (opposition and concession). Complete the reporting and contrast exercises; turn-taking and rebuttal are production extensions."},{"d":147,"w":21,"k":"r","e":[],"x":"A2-B1 review: Ch. 18 \"L'adverbe\", Ch. 22 \"Le comparatif et le superlatif\", Ch. 33 \"L'interrogation (2)\", Ch. 35 \"Le discours indirect au présent\" and Ch. 52 \"Les relations logiques\". Redo the chapter recap exercises and write one timed opinion paragraph; no new chapter."},{"d":148,"w":22,"k":"n","e":[{"b":"A2-B1","c":[41],"t":"Le temps (3)"},{"b":"A2-B1","c":[26],"t":"Les verbes en -ir, -oir et -re au présent"}],"x":"A2-B1 Ch. 41 - \"Le temps (3)\" (duration, chronology and succession); Ch. 26 - \"Les verbes en -ir, -oir et -re au présent\" (pouvoir/devoir/falloir). Complete the duration and modal exercises."},{"d":149,"w":22,"k":"n","e":[{"b":"A2-B1","c":[26],"t":"Les verbes en -ir, -oir et -re au présent"},{"b":"A2-B1","c":[51],"t":"Le subjonctif"}],"x":"A2-B1 Ch. 26 - \"Les verbes en -ir, -oir et -re au présent\" (pouvoir/devoir/falloir); Ch. 51 - \"Le subjonctif\" (il faut que/je veux que). Complete the modal and subjunctive exercises."},{"d":150,"w":22,"k":"n","e":[{"b":"A2-B1","c":[26],"t":"Les verbes en -ir, -oir et -re au présent"},{"b":"A2-B1","c":[37],"t":"Les prépositions et les verbes"},{"b":"A2-B1","c":[22],"t":"Le comparatif et le superlatif"}],"x":"A2-B1 Ch. 26 - \"Les verbes en -ir, -oir et -re au présent\" (pouvoir/devoir/vouloir/falloir); Ch. 37 - \"Les prépositions et les verbes\" (avoir besoin de); Ch. 22 - \"Le comparatif et le superlatif\" (mieux/meilleur). Complete the obligation, de-construction and comparison exercises."},{"d":151,"w":22,"k":"n","e":[{"b":"A2-B1","c":[39],"t":"Le futur proche"},{"b":"A2-B1","c":[40],"t":"Le passé composé"},{"b":"A2-B1","c":[43],"t":"L'imparfait"},{"b":"A2-B1","c":[47],"t":"Le futur simple"}],"x":"A2-B1 Ch. 39 - \"Le futur proche\"; Ch. 40 - \"Le passé composé\"; Ch. 43 - \"L'imparfait\"; Ch. 47 - \"Le futur simple\". Complete the tense-transformation and narrative exercises."},{"d":152,"w":22,"k":"n","e":[{"b":"A2-B1","c":[26],"t":"Les verbes en -ir, -oir et -re au présent"},{"b":"A2-B1","c":[31],"t":"Le conditionnel (1)"}],"x":"A2-B1 Ch. 26 - \"Les verbes en -ir, -oir et -re au présent\" (pouvoir/devoir/vouloir); Ch. 31 - \"Le conditionnel (1)\" (politeness and advice). Complete the modal and conditional-advice exercises."},{"d":153,"w":22,"k":"n","e":[{"b":"A2-B1","c":[26],"t":"Les verbes en -ir, -oir et -re au présent"},{"b":"A2-B1","c":[30],"t":"L'impératif"},{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"}],"x":"A2-B1 Ch. 26 - \"Les verbes en -ir, -oir et -re au présent\"; Ch. 30 - \"L'impératif\"; Ch. 35 - \"Le discours indirect au présent\" (indirect requests). Complete the modal, imperative and request exercises."},{"d":154,"w":22,"k":"r","e":[],"x":"A2-B1 review: Ch. 18-22, 26, 30-35, 39-45 and 47-52. Use Bilans n° 5-8 and the relevant chapter recaps; no new chapter."},{"d":155,"w":23,"k":"n","e":[{"b":"A2-B1","c":[42],"t":"Le passif"}],"x":"A2-B1 Ch. 42 - \"Le passif\". Complete the construction, constraints and usage exercises; passive voice is a direct chapter here, not an A1 extension."},{"d":156,"w":23,"k":"n","e":[{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"},{"b":"A2-B1","c":[45],"t":"Le discours indirect au passé"}],"x":"A2-B1 Ch. 35 - \"Le discours indirect au présent\"; Ch. 45 - \"Le discours indirect au passé\" when reporting past information. Complete the direct-to-indirect exercises."},{"d":157,"w":23,"k":"n","e":[{"b":"A2-B1","c":[26],"t":"Les verbes en -ir, -oir et -re au présent"},{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"}],"x":"A2-B1 Ch. 26 - \"Les verbes en -ir, -oir et -re au présent\" (savoir/connaître/vouloir); Ch. 35 - \"Le discours indirect au présent\" (reporting). Complete both chapter exercises."},{"d":158,"w":23,"k":"n","e":[{"b":"A2-B1","c":[52],"t":"Les relations logiques"}],"x":"A2-B1 Ch. 52 - \"Les relations logiques\" (cause, consequence, but, opposition and concession). Complete the chapter exercises; connector vocabulary is a production extension."},{"d":159,"w":23,"k":"n","e":[{"b":"A2-B1","c":[19],"t":"L'expression de la quantité"},{"b":"A2-B1","c":[22],"t":"Le comparatif et le superlatif"}],"x":"A2-B1 Ch. 19 - \"L'expression de la quantité\"; Ch. 22 - \"Le comparatif et le superlatif\". Complete the quantity and comparison exercises."},{"d":160,"w":23,"k":"n","e":[{"b":"A2-B1","c":[11],"t":"Le verbe avoir"},{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"},{"b":"A2-B1","c":[47],"t":"Le futur simple"}],"x":"A2-B1 Ch. 11 - \"Le verbe avoir\" (avoir expressions); Ch. 35 - \"Le discours indirect au présent\" (opinion/reporting); Ch. 47 - \"Le futur simple\". Complete the avoir, reporting and future exercises."},{"d":161,"w":23,"k":"r","e":[],"x":"A2-B1 review: Ch. 11, 18-19, 22, 26, 35, 42 and 52. Use the chapter recaps and relevant Bilans n° 5-8; no new chapter."},{"d":162,"w":24,"k":"n","e":[{"b":"A2-B1","c":[47],"t":"Le futur simple"},{"b":"A2-B1","c":[41],"t":"Le temps (3)"}],"x":"A2-B1 Ch. 47 - \"Le futur simple\"; Ch. 41 - \"Le temps (3)\" (chronology and time expressions). Complete the future and time transformation exercises."},{"d":163,"w":24,"k":"n","e":[{"b":"A2-B1","c":[40],"t":"Le passé composé"},{"b":"A2-B1","c":[43],"t":"L'imparfait"},{"b":"A2-B1","c":[26],"t":"and"},{"b":"A2-B1","c":[31],"t":"for modal and polite-request forms"}],"x":"A2-B1 Ch. 40 - \"Le passé composé\"; Ch. 43 - \"L'imparfait\"; Ch. 26 and Ch. 31 for modal and polite-request forms. Complete the narrative and request exercises."},{"d":164,"w":24,"k":"n","e":[{"b":"A2-B1","c":[44],"t":"Le plus-que-parfait"},{"b":"A2-B1","c":[40],"t":"Le passé composé"},{"b":"A2-B1","c":[43],"t":"L'imparfait"}],"x":"A2-B1 Ch. 44 - \"Le plus-que-parfait\"; Ch. 40 - \"Le passé composé\"; Ch. 43 - \"L'imparfait\". Complete the past-sequence and narrative exercises; plus-que-parfait is now a direct chapter."},{"d":165,"w":24,"k":"n","e":[{"b":"A2-B1","c":[32],"t":"Les relatifs"},{"b":"A2-B1","c":[26],"t":"and"},{"b":"A2-B1","c":[31],"t":"for requests"}],"x":"A2-B1 Ch. 32 - \"Les relatifs\" (relatifs simples and mise en relief); Ch. 26 and Ch. 31 for requests. Complete the sentence-joining and modal/request exercises."},{"d":166,"w":24,"k":"n","e":[{"b":"A2-B1","c":[32],"t":"Les relatifs"},{"b":"A2-B1","c":[22],"t":"Le comparatif et le superlatif"}],"x":"A2-B1 Ch. 32 - \"Les relatifs\"; Ch. 22 - \"Le comparatif et le superlatif\". Complete the relative, comparison and superlative exercises."},{"d":167,"w":24,"k":"n","e":[{"b":"A2-B1","c":[40],"t":"Le passé composé"},{"b":"A2-B1","c":[43],"t":"L'imparfait"},{"b":"A2-B1","c":[44],"t":"Le plus-que-parfait"},{"b":"A2-B1","c":[47],"t":"Le futur simple"}],"x":"A2-B1 Ch. 40 - \"Le passé composé\"; Ch. 43 - \"L'imparfait\"; Ch. 44 - \"Le plus-que-parfait\"; Ch. 47 - \"Le futur simple\". Complete the mixed-tense and narrative exercises."},{"d":168,"w":24,"k":"r","e":[],"x":"A2-B1 review: Ch. 26, 31-32, 39-44, 47, 50 and 52. Use Bilans n° 5-8 and the relevant chapter recaps; no new chapter."},{"d":169,"w":25,"k":"n","e":[{"b":"A2-B1","c":[22],"t":"Le comparatif et le superlatif"},{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"},{"b":"A2-B1","c":[39,44],"t":"and 47 for tense choice"},{"b":"A2-B1","c":[52],"t":"Les relations logiques"}],"x":"A2-B1 Ch. 22 - \"Le comparatif et le superlatif\"; Ch. 35 - \"Le discours indirect au présent\"; Ch. 39-44 and 47 for tense choice; Ch. 52 - \"Les relations logiques\". Use the relevant chapter exercises; paragraph functions are production work."},{"d":170,"w":25,"k":"n","e":[{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"},{"b":"A2-B1","c":[45],"t":"Le discours indirect au passé"}],"x":"A2-B1 Ch. 35 - \"Le discours indirect au présent\"; Ch. 45 - \"Le discours indirect au passé\". Complete the reporting transformations; dire/expliquer/ajouter are vocabulary extensions."},{"d":171,"w":25,"k":"r","e":[],"x":"A2-B1 review: Ch. 22, 26, 31, 35, 40, 43, 47 and 52. Reuse one exercise from each relevant area; no new chapter."},{"d":172,"w":25,"k":"n","e":[{"b":"A2-B1","c":[26],"t":"Les verbes en -ir, -oir et -re au présent"},{"b":"A2-B1","c":[33],"t":"L'interrogation (2)"},{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"},{"b":"A2-B1","c":[50],"t":"Les hypothèses"}],"x":"A2-B1 Ch. 26 - \"Les verbes en -ir, -oir et -re au présent\"; Ch. 33 - \"L'interrogation (2)\"; Ch. 35 - \"Le discours indirect au présent\"; Ch. 50 - \"Les hypothèses\". Complete the modal, question, indirect request and condition exercises."},{"d":173,"w":25,"k":"n","e":[{"b":"A2-B1","c":[26],"t":"Les verbes en -ir, -oir et -re au présent"},{"b":"A2-B1","c":[30],"t":"L'impératif"},{"b":"A2-B1","c":[35],"t":"Le discours indirect au présent"}],"x":"A2-B1 Ch. 26 - \"Les verbes en -ir, -oir et -re au présent\"; Ch. 30 - \"L'impératif\"; Ch. 35 - \"Le discours indirect au présent\". Complete the modal, imperative and indirect-request exercises."},{"d":174,"w":25,"k":"r","e":[],"x":"A2-B1 targeted review: select five weak areas from Ch. 22, 26, 30-35 and 39-52. Complete the exact accompanying exercises and record the error type; no new chapter."},{"d":175,"w":25,"k":"r","e":[],"x":"A2-B1 Test d'évaluation + Bilans n° 5-8. No new chapter: classify errors by chapter/topic and choose five Week 26 priorities."},{"d":176,"w":26,"k":"n","e":[{"b":"A2-B1","c":[32],"t":"Les relatifs"}],"x":"A2-B1 Ch. 32 - \"Les relatifs\" (ce qui/ce que and subject/object use). Complete Ex. 5-6, then Ex. 8 with argument sentences."},{"d":177,"w":26,"k":"n","e":[{"b":"A2-B1","c":[52],"t":"Les relations logiques"},{"b":"A2-B1","c":[37],"t":"Les prépositions et les verbes"}],"x":"A2-B1 Ch. 52 - \"Les relations logiques\" (grâce à/à cause de, cause and consequence); Ch. 37 - \"Les prépositions et les verbes\" for permettre de/contribuer à. Complete the cause and verb-construction exercises."},{"d":178,"w":26,"k":"n","e":[{"b":"A2-B1","c":[52],"t":"Les relations logiques"}],"x":"A2-B1 Ch. 52 - \"Les relations logiques\" (opposition and concession: certes, pourtant, cependant). Complete the accompanying opposition and concession exercises."},{"d":179,"w":26,"k":"n","e":[{"b":"A2-B1","c":[20],"t":"Le pronom en"},{"b":"A2-B1","c":[24],"t":"Le pronom y"},{"b":"A2-B1","c":[8],"t":"Les démonstratifs"}],"x":"A2-B1 Ch. 20 - \"Le pronom en\"; Ch. 24 - \"Le pronom y\"; targeted review of Ch. 8 - \"Les démonstratifs\" (celui-ci/celle-ci). Complete the pronoun-replacement exercises."},{"d":180,"w":26,"k":"n","e":[{"b":"A2-B1","c":[31],"t":"Le conditionnel (1)"}],"x":"A2-B1 Ch. 31 - \"Le conditionnel (1)\" (politeness, advice and proposals). Complete the formula, question and advice exercises."},{"d":181,"w":26,"k":"r","e":[],"x":"A2-B1 targeted review: Ch. 31-32, 37 and 52, plus the earlier tense, agreement and pronoun chapters. Redo the exact weak exercises and log each error type; no new chapter."},{"d":182,"w":26,"k":"r","e":[],"x":"A2-B1 review: Ch. 8, 20, 24, 31, 32, 37 and 52. Redo one matching exercise per structure and one timed paragraph; no new chapter."},{"d":183,"w":27,"k":"n","e":[{"b":"B1-B2","c":[14],"t":"Le discours indirect"}],"x":"B1-B2 Ch. 14 - \"Le discours indirect\" (interrogation indirecte and reformulation). Complete the direct-question and direct-to-indirect transformation exercises."},{"d":184,"w":27,"k":"n","e":[{"b":"B1-B2","c":[17],"t":"Les pronoms relatifs"},{"b":"B1-B2","c":[22],"t":"L'expression de la conséquence"},{"b":"B1-B2","c":[25],"t":"L'expression du but"}],"x":"B1-B2 Ch. 17 - \"Les pronoms relatifs\"; Ch. 22 - \"L'expression de la conséquence\"; Ch. 25 - \"L'expression du but\". Complete the relative, purpose and result sentence-joining exercises."},{"d":185,"w":27,"k":"n","e":[{"b":"B1-B2","c":[23],"t":"L'expression de la comparaison"},{"b":"B1-B2","c":[6],"t":"Le conditionnel"}],"x":"B1-B2 Ch. 23 - \"L'expression de la comparaison\" (quantitative change); Ch. 6 - \"Le conditionnel\" (estimates and probability). Complete the comparison and cautious-estimate exercises."},{"d":186,"w":27,"k":"n","e":[{"b":"B1-B2","c":[24],"t":"L'opposition et la concession"},{"b":"B1-B2","c":[6],"t":"Le conditionnel"}],"x":"B1-B2 Ch. 24 - \"L'opposition et la concession\"; Ch. 6 - \"Le conditionnel\" (reassurance and proposed solutions). Complete the concession transformations and conditional suggestions."},{"d":187,"w":27,"k":"n","e":[{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"},{"b":"B1-B2","c":[26],"t":"L'expression de la condition et de l'hypothèse"}],"x":"B1-B2 Ch. 4 - \"Les temps de l'indicatif\" (future and future reference); Ch. 26 - \"L'expression de la condition et de l'hypothèse\". Complete the future and si-clause exercises."},{"d":188,"w":27,"k":"n","e":[{"b":"B1-B2","c":[14],"t":"Le discours indirect"}],"x":"B1-B2 Ch. 14 - \"Le discours indirect\" (reported decisions, commitments and tense concordance). Complete the direct-to-indirect reporting exercises."},{"d":189,"w":27,"k":"r","e":[],"x":"B1-B2 review: Ch. 6, 14, 17, 22-26. Redo one relevant exercise per structure and correct the client case summary; no new chapter."},{"d":190,"w":28,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication: mécanismes et nuances"}],"x":"B1-B2 Ch. 27 - \"Communication: mécanismes et nuances\" (obligation, permission and interdiction). Complete the exercises distinguishing external obligation from personal choice."},{"d":191,"w":28,"k":"n","e":[{"b":"B1-B2","c":[11],"t":"La forme passive"}],"x":"B1-B2 Ch. 11 - \"La forme passive\". Complete active/passive transformations and the formal or administrative usage exercises."},{"d":192,"w":28,"k":"n","e":[{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"},{"b":"B1-B2","c":[27],"t":"Communication: mécanismes et nuances"}],"x":"B1-B2 Ch. 4 - \"Les temps de l'indicatif\" (formal chronology); Ch. 27 - \"Communication: mécanismes et nuances\" (formal wording). Complete the narrative and institutional-language exercises."},{"d":193,"w":28,"k":"n","e":[{"b":"B1-B2","c":[24],"t":"L'opposition et la concession"},{"b":"B1-B2","c":[6],"t":"Le conditionnel"}],"x":"B1-B2 Ch. 24 - \"L'opposition et la concession\" (bien que, malgré, pourtant); Ch. 6 - \"Le conditionnel\" (polite requests). Complete the concession and request transformations."},{"d":194,"w":28,"k":"n","e":[{"b":"B1-B2","c":[5],"t":"Le subjonctif"}],"x":"B1-B2 Ch. 5 - \"Le subjonctif\" (il est important que and possibility or necessity). Complete the subjunctive and indicative/subjunctive choice exercises."},{"d":195,"w":28,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication: mécanismes et nuances"}],"x":"B1-B2 Ch. 27 - \"Communication: mécanismes et nuances\" (definition, examples, certainty and uncertainty). Complete the positive, negative and uncertainty response exercises."},{"d":196,"w":28,"k":"r","e":[],"x":"B1-B2 review: Ch. 5, 6, 11, 14, 24 and 27. Use the relevant chapter recap exercises to correct one formal letter; no new chapter."},{"d":197,"w":29,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"},{"b":"B1-B2","c":[20],"t":"La situation dans le temps"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (frequency and placement); Ch. 20 - \"La situation dans le temps\" (duration and frequency). Complete the time-adverb and depuis/pendant exercises."},{"d":198,"w":29,"k":"n","e":[{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"},{"b":"B1-B2","c":[20],"t":"La situation dans le temps"}],"x":"B1-B2 Ch. 4 - \"Les temps de l'indicatif\" (past-tense chronology); Ch. 20 - \"La situation dans le temps\" (depuis, pendant and duration). Complete the past-narrative and timeline exercises."},{"d":199,"w":29,"k":"n","e":[{"b":"B1-B2","c":[6],"t":"Le conditionnel"},{"b":"A2-B1","c":[30],"t":"L'impératif"}],"x":"B1-B2 Ch. 6 - \"Le conditionnel\" (advice); targeted review of A2-B1 Ch. 30 - \"L'impératif\" because B1-B2 has no dedicated imperative chapter. Complete the advice and imperative transformations."},{"d":200,"w":29,"k":"n","e":[{"b":"B1-B2","c":[21],"t":"L'expression de la cause"},{"b":"B1-B2","c":[22],"t":"L'expression de la conséquence"}],"x":"B1-B2 Ch. 21 - \"L'expression de la cause\"; Ch. 22 - \"L'expression de la conséquence\". Complete the cause/consequence connector exercises and apply them to coping suggestions."},{"d":201,"w":29,"k":"n","e":[{"b":"B1-B2","c":[6],"t":"Le conditionnel"},{"b":"B1-B2","c":[27],"t":"Communication: mécanismes et nuances"}],"x":"B1-B2 Ch. 6 - \"Le conditionnel\" (cautious or unverified information); Ch. 27 - \"Communication: mécanismes et nuances\" (modalisation). Complete the uncertainty and evidence-language exercises."},{"d":202,"w":29,"k":"n","e":[{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"},{"b":"B1-B2","c":[6],"t":"Le conditionnel"}],"x":"B1-B2 Ch. 4 - \"Les temps de l'indicatif\" (future); Ch. 6 - \"Le conditionnel\" (realistic proposals). Complete the future-planning and conditional exercises."},{"d":203,"w":29,"k":"r","e":[],"x":"B1-B2 review: Ch. 4-6, 15 and 20-22. Redo the matching time, advice and cause/effect exercises; no new chapter."},{"d":204,"w":30,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication: mécanismes et nuances"},{"b":"B1-B2","c":[14],"t":"Le discours indirect"}],"x":"B1-B2 Ch. 27 - \"Communication: mécanismes et nuances\" (reformulation and degrees of certainty); Ch. 14 - \"Le discours indirect\". Complete the reformulation exercises, then synthesize the two texts."},{"d":205,"w":30,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication: mécanismes et nuances"},{"b":"B1-B2","c":[14],"t":"Le discours indirect"}],"x":"B1-B2 Ch. 27 - \"Communication: mécanismes et nuances\" (concise reformulation); Ch. 14 - \"Le discours indirect\". Complete the transformation exercises, then convert the content into notes."},{"d":206,"w":30,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"},{"b":"B1-B2","c":[27],"t":"Communication: mécanismes et nuances"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (d'abord, par ailleurs, de plus, enfin and placement); Ch. 27 - \"Communication: mécanismes et nuances\". Complete the organization and adverb-placement exercises."},{"d":207,"w":30,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication: mécanismes et nuances"},{"b":"B1-B2","c":[24],"t":"L'opposition et la concession"}],"x":"B1-B2 Ch. 27 - \"Communication: mécanismes et nuances\" (clarification and nuanced response); Ch. 24 - \"L'opposition et la concession\". Complete the nuance and objection-response exercises."},{"d":208,"w":30,"k":"r","e":[],"x":"B1-B2 review: Ch. 6, 14, 17 and 21-27. Use the cause, consequence, comparison, concession, purpose and condition exercises; no new chapter."},{"d":209,"w":30,"k":"r","e":[],"x":"B1-B2 targeted review: select the exact accompanying exercises from Ch. 4-6, 11, 14-17, 20-27 according to the error log; no new chapter."},{"d":210,"w":30,"k":"r","e":[],"x":"B1-B2 review/test preparation: use the relevant chapter tests and recaps from Ch. 4-6, 11, 14-17 and 20-27; no new chapter."},{"d":211,"w":31,"k":"n","e":[{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"}],"x":"B1-B2 Ch. 4 - \"Les temps de l'indicatif\" (les passés and l'antériorité: imparfait, passé composé and plus-que-parfait). Complete the past-narrative and timeline exercises."},{"d":212,"w":31,"k":"n","e":[{"b":"B1-B2","c":[14],"t":"Le discours indirect"}],"x":"B1-B2 Ch. 14 - \"Le discours indirect\" (interrogation indirecte and concordance des temps). Complete the direct-to-indirect question and past-report transformations."},{"d":213,"w":31,"k":"n","e":[{"b":"B1-B2","c":[20],"t":"La situation dans le temps"}],"x":"B1-B2 Ch. 20 - \"La situation dans le temps\" (antériorité, simultanéité, postériorité and sequence markers). Complete the time-connector and narrative-order exercises."},{"d":214,"w":31,"k":"n","e":[{"b":"B1-B2","c":[7],"t":"L'infinitif"},{"b":"B1-B2","c":[21],"t":"L'expression de la cause"}],"x":"B1-B2 Ch. 7 - \"L'infinitif\" (faire/laisser + infinitif); Ch. 21 - \"L'expression de la cause\". Complete the infinitive and cause-to-consequence exercises."},{"d":215,"w":31,"k":"n","e":[{"b":"B1-B2","c":[6],"t":"Le conditionnel"}],"x":"B1-B2 Ch. 6 - \"Le conditionnel\" (conditionnel passé: regret and reproche). Complete the regret and alternative-action exercises."},{"d":216,"w":31,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"},{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"}],"x":"B1-B2 Ch. 27 - \"Communication : mécanismes et nuances\" (clarification, qualification and nuanced responses); Ch. 4 - \"Les temps de l'indicatif\" for narrative tense choice. Complete the nuance and short-narrative exercises."},{"d":217,"w":31,"k":"r","e":[],"x":"B1-B2 review: Ch. 4 \"Les temps de l'indicatif\", Ch. 6 \"Le conditionnel\", Ch. 14 \"Le discours indirect\", Ch. 20 \"La situation dans le temps\" and Ch. 27 \"Communication : mécanismes et nuances\". Redo matching review/test exercises; no new chapter."},{"d":218,"w":32,"k":"n","e":[{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"},{"b":"B1-B2","c":[20],"t":"La situation dans le temps"}],"x":"B1-B2 Ch. 4 - \"Les temps de l'indicatif\" (les passés and l'antériorité); Ch. 20 - \"La situation dans le temps\" (dates, duration and sequence). Complete the chronology and depuis/pendant exercises."},{"d":219,"w":32,"k":"n","e":[{"b":"B1-B2","c":[9],"t":"Le gérondif"}],"x":"B1-B2 Ch. 9 - \"Le gérondif\" (simultanéité, cause, moyen/manière and condition). Complete the sentence-rewriting and meaning-choice exercises."},{"d":220,"w":32,"k":"n","e":[{"b":"B1-B2","c":[23],"t":"L'expression de la comparaison"}],"x":"B1-B2 Ch. 23 - \"L'expression de la comparaison\" (comparison, proportion and criteria). Complete the comparison and proportionality exercises."},{"d":221,"w":32,"k":"n","e":[{"b":"B1-B2","c":[17],"t":"Les pronoms relatifs"},{"b":"B1-B2","c":[22],"t":"L'expression de la conséquence"}],"x":"B1-B2 Ch. 17 - \"Les pronoms relatifs\" (qui, que, ce qui, ce que and ce dont); Ch. 22 - \"L'expression de la conséquence\". Complete the relative-clause and result-linking exercises."},{"d":222,"w":32,"k":"n","e":[{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"},{"b":"B1-B2","c":[6],"t":"Le conditionnel"},{"b":"B1-B2","c":[26],"t":"L'expression de la condition et de l'hypothèse"}],"x":"B1-B2 Ch. 4 - \"Les temps de l'indicatif\" (futur); Ch. 6 - \"Le conditionnel\"; Ch. 26 - \"L'expression de la condition et de l'hypothèse\". Complete the future, aspiration and si-clause exercises."},{"d":223,"w":32,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 27 - \"Communication : mécanismes et nuances\" (definition, evidence, certainty and uncertainty). Complete the modalisation and nuanced-answer exercises."},{"d":224,"w":32,"k":"r","e":[],"x":"B1-B2 review: Ch. 4 (temps de l'indicatif), 6 (conditionnel), 9 (gérondif), 17 (pronoms relatifs), 23 (comparaison), 26 (condition/hypothèse) and 27 (communication/nuances). Redo matching exercises; no new chapter."},{"d":225,"w":33,"k":"n","e":[{"b":"B1-B2","c":[17],"t":"Les pronoms relatifs"},{"b":"B1-B2","c":[23],"t":"L'expression de la comparaison"}],"x":"B1-B2 Ch. 17 - \"Les pronoms relatifs\" (qui, que, ce qui, ce que and ce dont); Ch. 23 - \"L'expression de la comparaison\" (analogy). Complete the relative-clause and analogy exercises."},{"d":226,"w":33,"k":"n","e":[{"b":"B1-B2","c":[9],"t":"Le gérondif"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"}],"x":"B1-B2 Ch. 9 - \"Le gérondif\" (tout en + participe présent); Ch. 24 - \"L'expression de l'opposition et de la concession\" (d'un côté, de l'autre and balancing). Complete the gérondif and opposition/concession transformations."},{"d":227,"w":33,"k":"n","e":[{"b":"B1-B2","c":[11],"t":"La forme passive"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 11 - \"La forme passive\"; Ch. 27 - \"Communication : mécanismes et nuances\" (obligation, autorisation and interdiction). Complete the active/passive and obligation-language exercises."},{"d":228,"w":33,"k":"n","e":[{"b":"B1-B2","c":[21],"t":"L'expression de la cause"},{"b":"B1-B2","c":[26],"t":"L'expression de la condition et de l'hypothèse"}],"x":"B1-B2 Ch. 21 - \"L'expression de la cause\"; Ch. 26 - \"L'expression de la condition et de l'hypothèse\" (risk and mitigation). Complete the cause and condition/consequence exercises."},{"d":229,"w":33,"k":"n","e":[{"b":"B1-B2","c":[6],"t":"Le conditionnel"},{"b":"B1-B2","c":[14],"t":"Le discours indirect"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 6 - \"Le conditionnel\" (unverified information); Ch. 14 - \"Le discours indirect\"; Ch. 27 - \"Communication : mécanismes et nuances\" (uncertainty). Complete the source-reporting and uncertainty exercises."},{"d":230,"w":33,"k":"n","e":[{"b":"B1-B2","c":[5],"t":"Le subjonctif"},{"b":"B1-B2","c":[25],"t":"L'expression du but"}],"x":"B1-B2 Ch. 5 - \"Le subjonctif\"; Ch. 25 - \"L'expression du but\" (pour que, afin que and de peur que). Complete the indicative/subjunctive-choice and purpose exercises."},{"d":231,"w":33,"k":"r","e":[],"x":"B1-B2 review: Ch. 5 (subjonctif), 6 (conditionnel), 11 (forme passive), 14 (discours indirect), 17 (pronoms relatifs), 24 (opposition/concession), 25 (but) and 27 (communication/nuances). Redo matching exercises; no new chapter."},{"d":232,"w":34,"k":"n","e":[{"b":"B1-B2","c":[21],"t":"L'expression de la cause"}],"x":"B1-B2 Ch. 21 - \"L'expression de la cause\" (precise written cause connectors). Complete the cause-connector and cause/consequence exercises. The books have no dedicated nominalization chapter, so treat nominalization as a vocabulary extension."},{"d":233,"w":34,"k":"n","e":[{"b":"B1-B2","c":[14],"t":"Le discours indirect"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"}],"x":"B1-B2 Ch. 14 - \"Le discours indirect\" (reported statements); Ch. 24 - \"L'expression de l'opposition et de la concession\". Complete the reported-viewpoint and contrast transformations."},{"d":234,"w":34,"k":"n","e":[{"b":"B1-B2","c":[26],"t":"L'expression de la condition et de l'hypothèse"},{"b":"B1-B2","c":[6],"t":"Le conditionnel"}],"x":"B1-B2 Ch. 26 - \"L'expression de la condition et de l'hypothèse\"; Ch. 6 - \"Le conditionnel\". Complete the si-clause and conditional-outcome exercises."},{"d":235,"w":34,"k":"n","e":[{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"},{"b":"B1-B2","c":[5],"t":"Le subjonctif"}],"x":"B1-B2 Ch. 24 - \"L'expression de l'opposition et de la concession\" (bien que, meme si, malgré, pourtant); Ch. 5 - \"Le subjonctif\" for bien que. Complete the concession transformations."},{"d":236,"w":34,"k":"n","e":[{"b":"B1-B2","c":[11],"t":"La forme passive"},{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"},{"b":"B1-B2","c":[20],"t":"La situation dans le temps"}],"x":"B1-B2 Ch. 11 - \"La forme passive\"; Ch. 4 - \"Les temps de l'indicatif\" (futur); Ch. 20 - \"La situation dans le temps\" (sequence). Complete the future-passive and action-sequencing exercises."},{"d":237,"w":34,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"},{"b":"B1-B2","c":[14],"t":"Le discours indirect"}],"x":"B1-B2 Ch. 27 - \"Communication : mécanismes et nuances\" (qualification and audience response); Ch. 14 - \"Le discours indirect\" (interrogation indirecte). Complete the nuanced-answer and question-reformulation exercises."},{"d":238,"w":34,"k":"r","e":[],"x":"B1-B2 review: Ch. 4-6 (temps, subjonctif, conditionnel), 11 (passive), 14 (discours indirect), 20 (situation dans le temps), 21 (cause), 24 (opposition/concession), 26 (condition/hypothèse) and 27 (communication/nuances). Redo matching exercises; no new chapter."},{"d":239,"w":35,"k":"n","e":[{"b":"B1-B2","c":[14],"t":"Le discours indirect"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 14 - \"Le discours indirect\" (neutral reported information); Ch. 24 - \"L'expression de l'opposition et de la concession\"; Ch. 27 - \"Communication : mécanismes et nuances\". Complete the reporting and contrast exercises."},{"d":240,"w":35,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"},{"b":"B1-B2","c":[15],"t":"L'adverbe"}],"x":"B1-B2 Ch. 27 - \"Communication : mécanismes et nuances\" (doute, incertitude and probabilité); Ch. 15 - \"L'adverbe\" (adverbes de modalité). Complete the inference and attitude-marker exercises."},{"d":241,"w":35,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (d'abord, par ailleurs, de plus, en outre, enfin); Ch. 24 - \"L'expression de l'opposition et de la concession\"; Ch. 27 - \"Communication : mécanismes et nuances\". Complete the organization, counterpoint and nuance exercises."},{"d":242,"w":35,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"},{"b":"B1-B2","c":[15],"t":"L'adverbe"}],"x":"B1-B2 Ch. 27 - \"Communication : mécanismes et nuances\" (clarification, hesitation and qualification); Ch. 15 - \"L'adverbe\" (adverbes de modalité). Complete the nuanced-response exercises."},{"d":243,"w":35,"k":"n","e":[{"b":"B1-B2","c":[14],"t":"Le discours indirect"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 14 - \"Le discours indirect\" (reporting source information); Ch. 24 - \"L'expression de l'opposition et de la concession\"; Ch. 27 - \"Communication : mécanismes et nuances\". Complete the reporting, contrast and viewpoint exercises."},{"d":244,"w":35,"k":"r","e":[],"x":"B1-B2 targeted review: select the exact accompanying exercises from Ch. 4-6, 9, 11, 14-17, 20-27 according to the error log; no new chapter."},{"d":245,"w":35,"k":"r","e":[],"x":"B1-B2 Bilan n° 8 and Test d'évaluation: review the exact chapter/topic for each error from Ch. 4-6, 9, 11, 14-17 and 20-27. Complete only the matching test and recap exercises; no new chapter."},{"d":246,"w":36,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (d'abord, en outre, en conclusion); Ch. 24 - \"L'expression de l'opposition et de la concession\" (toutefois). Complete the discourse-organization and adverb-placement exercises."},{"d":247,"w":36,"k":"n","e":[{"b":"B1-B2","c":[3],"t":"Les négations"},{"b":"B1-B2","c":[15],"t":"L'adverbe"}],"x":"B1-B2 Ch. 3 - \"Les négations\" (negative placement); Ch. 15 - \"L'adverbe\" (même, surtout, seulement). Complete the negation and precision/restriction exercises; add ne...que as an extension."},{"d":248,"w":36,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (adverbes de modalité); Ch. 27 - \"Communication : mécanismes et nuances\" (approval, doubt and criticism). Complete the modality and nuanced-response exercises."},{"d":249,"w":36,"k":"n","e":[{"b":"B1-B2","c":[5],"t":"Le subjonctif"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 5 - \"Le subjonctif\" (possibility/doubt); Ch. 27 - \"Communication : mécanismes et nuances\" (probability and uncertainty). Complete the subjunctive-choice and cautious-inference exercises."},{"d":250,"w":36,"k":"n","e":[{"b":"B1-B2","c":[2],"t":"L'adjectif"},{"b":"B1-B2","c":[26],"t":"L'expression de la condition et de l'hypothèse"}],"x":"B1-B2 Ch. 2 - \"L'adjectif\" (adjectifs numéraux and fractions); Ch. 26 - \"L'expression de la condition et de l'hypothèse\". Complete the number/fraction and condition exercises."},{"d":251,"w":36,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 27 - \"Communication : mécanismes et nuances\" (reformulation and concise meaning). Complete the paraphrase/nuance exercises; abbreviation and note-taking are extensions."},{"d":252,"w":36,"k":"r","e":[],"x":"B1-B2 review: Ch. 2 (adjectif/numbers), 3 (négations), 5 (subjonctif), 15 (adverbe), 24 (opposition/concession) and 27 (communication/nuances). Redo matching exercises; no new chapter."},{"d":253,"w":37,"k":"n","e":[{"b":"B1-B2","c":[14],"t":"Le discours indirect"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 14 - \"Le discours indirect\" (interrogation indirecte); Ch. 27 - \"Communication : mécanismes et nuances\" (clarification). Complete the question-reformulation and nuanced follow-up exercises."},{"d":254,"w":37,"k":"n","e":[{"b":"B1-B2","c":[6],"t":"Le conditionnel"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 6 - \"Le conditionnel\" (suggestion and polite request); Ch. 27 - \"Communication : mécanismes et nuances\" (souhait and benefit framing). Complete the proposal and suggestion exercises."},{"d":255,"w":37,"k":"n","e":[{"b":"B1-B2","c":[14],"t":"Le discours indirect"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 14 - \"Le discours indirect\" (interrogation indirecte); Ch. 27 - \"Communication : mécanismes et nuances\" (clarification and hesitation). Complete the indirect-question and clarification exercises."},{"d":256,"w":37,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"},{"b":"B1-B2","c":[26],"t":"L'expression de la condition et de l'hypothèse"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (certes); Ch. 24 - \"L'expression de l'opposition et de la concession\" (même si); Ch. 26 - \"L'expression de la condition et de l'hypothèse\". Complete the concession and conditional-alternative exercises."},{"d":257,"w":37,"k":"n","e":[{"b":"B1-B2","c":[6],"t":"Le conditionnel"},{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"}],"x":"B1-B2 Ch. 6 - \"Le conditionnel\"; Ch. 4 - \"Les temps de l'indicatif\" (futur); Ch. 24 - \"L'expression de l'opposition et de la concession\". Complete the future, conditional and concession exercises."},{"d":258,"w":37,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (discourse-marker placement). Complete the organization/placement exercises. No dedicated chapter covers liaison, rhythm or stress; practise those separately."},{"d":259,"w":37,"k":"r","e":[],"x":"B1-B2 review: Ch. 4 (indicatif), 6 (conditionnel), 14 (discours indirect), 15 (adverbe), 24 (opposition/concession) and 27 (communication/nuances). Redo matching exercises; no new chapter."},{"d":260,"w":38,"k":"n","e":[{"b":"B1-B2","c":[7],"t":"L'infinitif"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 7 - \"L'infinitif\" (orders, advice and directives); Ch. 27 - \"Communication : mécanismes et nuances\" (register). Complete the directive and register-choice exercises."},{"d":261,"w":38,"k":"n","e":[{"b":"B1-B2","c":[6],"t":"Le conditionnel"},{"b":"B1-B2","c":[15],"t":"L'adverbe"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 6 - \"Le conditionnel\" (polite requests); Ch. 15 - \"L'adverbe\" (written organization); Ch. 27 - \"Communication : mécanismes et nuances\". Complete the formal-request and connector exercises."},{"d":262,"w":38,"k":"n","e":[{"b":"B1-B2","c":[4],"t":"Les temps de l'indicatif"},{"b":"B1-B2","c":[20],"t":"La situation dans le temps"}],"x":"B1-B2 Ch. 4 - \"Les temps de l'indicatif\" (past narrative); Ch. 20 - \"La situation dans le temps\" (sequence). Complete the narrative-tense and time-sequencing exercises."},{"d":263,"w":38,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (organization of ideas); Ch. 24 - \"L'expression de l'opposition et de la concession\"; Ch. 27 - \"Communication : mécanismes et nuances\". Complete the structure and counterpoint exercises."},{"d":264,"w":38,"k":"n","e":[{"b":"B1-B2","c":[14],"t":"Le discours indirect"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 14 - \"Le discours indirect\" (reported information); Ch. 27 - \"Communication : mécanismes et nuances\" (reformulation). Complete the source-reporting and paraphrase exercises."},{"d":265,"w":38,"k":"r","e":[],"x":"B1-B2 targeted review: Ch. 2 (agreement), 4 (indicatif), 5 (subjonctif), 6 (conditionnel), 15 (adverbe), 17 (pronoms relatifs), 24 (opposition/concession) and 27 (communication/nuances). Redo matching exercises; no new chapter."},{"d":266,"w":38,"k":"r","e":[],"x":"B1-B2 targeted review: choose the exact exercise from the matching chapter/topic (Ch. 2-7, 9, 11, 14-17, 20-27) for each written error; no new chapter."},{"d":267,"w":39,"k":"n","e":[{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 27 - \"Communication : mécanismes et nuances\" (definition, purpose and register). Complete the communication-function exercises; text-type vocabulary is an extension."},{"d":268,"w":39,"k":"n","e":[{"b":"B1-B2","c":[17],"t":"Les pronoms relatifs"},{"b":"B1-B2","c":[21],"t":"L'expression de la cause"},{"b":"B1-B2","c":[26],"t":"L'expression de la condition et de l'hypothèse"}],"x":"B1-B2 Ch. 17 - \"Les pronoms relatifs\" (reference links); Ch. 21 - \"L'expression de la cause\"; Ch. 26 - \"L'expression de la condition et de l'hypothèse\". Complete the reference, cause and condition-link exercises; lexical fields are an extension."},{"d":269,"w":39,"k":"n","e":[{"b":"B1-B2","c":[21],"t":"L'expression de la cause"},{"b":"B1-B2","c":[22],"t":"L'expression de la conséquence"},{"b":"B1-B2","c":[24],"t":"L'expression de l'opposition et de la concession"}],"x":"B1-B2 Ch. 21 - \"L'expression de la cause\"; Ch. 22 - \"L'expression de la conséquence\"; Ch. 24 - \"L'expression de l'opposition et de la concession\". Complete the connector-selection and sentence-linking exercises."},{"d":270,"w":39,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (adverbes en \"-ment\"). Complete the formation/meaning exercises; prefixes, word families and collocations are vocabulary extensions."},{"d":271,"w":39,"k":"n","e":[{"b":"B1-B2","c":[15],"t":"L'adverbe"},{"b":"B1-B2","c":[27],"t":"Communication : mécanismes et nuances"}],"x":"B1-B2 Ch. 15 - \"L'adverbe\" (adverbes de modalité and organization); Ch. 27 - \"Communication : mécanismes et nuances\". Complete the viewpoint and nuance exercises."},{"d":272,"w":39,"k":"r","e":[],"x":"B1-B2 reading review: Ch. 15 (adverbe), 17 (pronoms relatifs), 21-22 (cause/conséquence), 24 (opposition/concession), 26 (condition/hypothèse) and 27 (communication/nuances). Redo matching exercises; no new chapter."},{"d":273,"w":39,"k":"r","e":[],"x":"B1-B2 reading review: Ch. 15 (adverbe), 17 (pronoms relatifs), 21-22 (cause/conséquence), 24 (opposition/concession), 26 (condition/hypothèse) and 27 (communication/nuances). Redo connector, reference and inference exercises; no new chapter."},{"d":274,"w":40,"k":"r","e":[],"x":"B1-B2 targeted review: use the exact matching exercise from Ch. 4-6, 9, 11, 14-17 and 20-27 for grammar errors found in the listening transcript; no new chapter."},{"d":275,"w":40,"k":"r","e":[],"x":"B1-B2 targeted review: use the exact matching exercise from Ch. 2-6, 14-17 and 20-27 for grammar errors found in reading; log each chapter/topic; no new chapter."},{"d":276,"w":40,"k":"r","e":[],"x":"B1-B2 targeted review: Ch. 4-6 (indicatif, subjonctif, conditionnel), 9 (gérondif), 14-15 (discours indirect, adverbe), 17 (pronoms relatifs) and 20-27 (relations logiques/communication). Redo exact exercises; no new chapter."},{"d":277,"w":40,"k":"r","e":[],"x":"B1-B2 targeted review: Ch. 6 (conditionnel), 14 (discours indirect), 15 (adverbe), 21-22 (cause/conséquence), 24-27 (opposition, but, condition, communication). Redo exact formal/opinion exercises; no new chapter."},{"d":278,"w":40,"k":"r","e":[],"x":"B1-B2 personalized review: select the exact accompanying exercise from the chapter/topic corresponding to each of the top three gaps; no new chapter."},{"d":279,"w":40,"k":"r","e":[],"x":"B1-B2: no new chapter. Review only the error-log examples and redo the exact accompanying exercises from the relevant chapter/topic after the mock."},{"d":280,"w":40,"k":"r","e":[],"x":"B1-B2 Bilan n° 8 and Test d'évaluation: map each diagnostic error to its exact chapter/topic, then complete only the matching recap/test exercises; no new chapter."},{"d":281,"w":41,"k":"r","e":[],"x":"Review only structures repeatedly missed in Week 40 listening."},{"d":282,"w":41,"k":"r","e":[],"x":"Complete one targeted exercise on implication, tone or conditions."},{"d":283,"w":41,"k":"r","e":[],"x":"Complete only exercises on connectors/referents that caused errors."},{"d":284,"w":41,"k":"r","e":[],"x":"No broad book work; review only vocabulary that blocked comprehension."},{"d":285,"w":41,"k":"r","e":[],"x":"Practise only two recurring spoken grammar errors."},{"d":286,"w":41,"k":"r","e":[],"x":"Complete corresponding grammar-book exercises, then transfer to free writing."},{"d":287,"w":41,"k":"r","e":[],"x":"Complete a short mixed review; compare with Week 40 error rate."},{"d":288,"w":42,"k":"r","e":[],"x":"Review answers only after the full timed section is complete."},{"d":289,"w":42,"k":"r","e":[],"x":"Review only after submitting the full timed section."},{"d":290,"w":42,"k":"r","e":[],"x":"Review five model phrases only, then stop studying."},{"d":291,"w":42,"k":"r","e":[],"x":"Review your checklist, then complete the tasks independently."},{"d":292,"w":42,"k":"r","e":[],"x":"Group errors into knowledge, attention, timing and strategy."},{"d":293,"w":42,"k":"r","e":[],"x":"No exercises between sections; reproduce realistic conditions."},{"d":294,"w":42,"k":"r","e":[],"x":"Compare Mock 1 and Mock 2 by skill and error category."},{"d":295,"w":43,"k":"r","e":[],"x":"No broad grammar study; review the relevant examples."},{"d":296,"w":43,"k":"r","e":[],"x":"No broad exercises; revisit the relevant error examples."},{"d":297,"w":43,"k":"r","e":[],"x":"Review your five recurring corrections, then speak."},{"d":298,"w":43,"k":"r","e":[],"x":"Review one formal and one argument outline only."},{"d":299,"w":43,"k":"r","e":[],"x":"No new exercises; organize materials and mental routines."},{"d":300,"w":43,"k":"r","e":[],"x":"No grammar-book work unless correcting one critical uncertainty."},{"d":301,"w":43,"k":"r","e":[],"x":"Close the error log and carry forward only post-test learning notes."}];


const COLORS = {
  bg: "#0B1220",
  card: "#131C2E",
  cardHover: "#182238",
  border: "#25314A",
  accent: "#3B82F6",
  accentSoft: "rgba(59,130,246,0.14)",
  hard: "#F59E0B",
  hardSoft: "rgba(245,158,11,0.14)",
  gold: "#F5B841",
  goldSoft: "rgba(245,184,65,0.14)",
  frBlue: "#2E4A9E",
  frRed: "#B23A48",
  text: "#E8EDF6",
  muted: "#8291AB",
  success: "#22C55E",
  successSoft: "rgba(34,197,94,0.14)",
};

const GLOBAL_CSS =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap'); html, body { height: 100%; margin: 0; background: " +
  COLORS.bg +
  "; } input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type='number'] { -moz-appearance: textfield; appearance: textfield; }";

function GlobalStyle() {
  return <style>{GLOBAL_CSS}</style>;
}

function todayKey() {
  return new Date().toDateString();
}

function loadFrenchVoice() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve(null);
      return;
    }
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const exact = voices.find((v) => v.lang === "fr-FR");
      const loose = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("fr"));
      resolve(exact || loose || null);
    };
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      pick();
    } else {
      window.speechSynthesis.onvoiceschanged = pick;
      setTimeout(pick, 400);
    }
  });
}

function waitForStorage(maxAttempts, intervalMs) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      if (typeof window !== "undefined" && window.storage) {
        resolve(true);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        resolve(false);
        return;
      }
      setTimeout(check, intervalMs);
    };
    check();
  });
}

async function diagnoseStorage() {
  if (typeof window === "undefined" || !window.storage) {
    return { ok: false, message: "window.storage is not present in this environment." };
  }
  try {
    await window.storage.set("__diag__", "ok", false);
  } catch (e) {
    return { ok: false, message: "storage.set failed: " + (e && e.message ? e.message : String(e)) };
  }
  try {
    const r = await window.storage.get("__diag__", false);
    if (!r || r.value !== "ok") {
      return { ok: false, message: "storage.get returned unexpected value: " + JSON.stringify(r) };
    }
  } catch (e) {
    return { ok: false, message: "storage.get failed: " + (e && e.message ? e.message : String(e)) };
  }
  return { ok: true, message: "" };
}

function weightedSample(pool, hardSet, count) {
  const arr = pool.map((c) => ({ ...c, weight: hardSet.has(c.i) ? 5 : 1 }));
  const out = [];
  for (let n = 0; n < count && arr.length > 0; n++) {
    const total = arr.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < arr.length; idx++) {
      r -= arr[idx].weight;
      if (r <= 0) break;
    }
    idx = Math.min(idx, arr.length - 1);
    out.push(arr[idx]);
    arr.splice(idx, 1);
  }
  return out;
}

function buildSession(progress, hardWordsSet) {
  const dayIdx = progress.current_day - 1;
  if (dayIdx < 0 || dayIdx >= TOTAL_DAYS) return null;
  const dayObj = DAYS[dayIdx];
  const newWords = dayObj.c.map((c) => ({ ...c, sourceDay: dayObj.d }));
  const completedCount = progress.completed_days.length;
  const reviewPool = [];
  for (const d of DAYS) {
    if (d.d < dayObj.d) {
      for (const c of d.c) reviewPool.push({ ...c, sourceDay: d.d });
    }
  }
  const target = Math.round(5 + (35 / 300) * completedCount);
  const reviewCount = Math.min(target, reviewPool.length);
  const reviewSelected = weightedSample(reviewPool, hardWordsSet, reviewCount);

  // New words: always French -> English, one card each, no reverse pass.
  const newItems = newWords.map((w) => ({
    ...w,
    dir: "FE",
    key: w.i + "-new-" + dayObj.d,
  }));

  // Review words: one card each, direction chosen at random per card.
  const reviewItems = reviewSelected.map((w) => ({
    ...w,
    dir: Math.random() < 0.5 ? "EF" : "FE",
    key: w.i + "-rev-" + w.sourceDay + "-" + dayObj.d,
  }));

  const words = [...newItems, ...reviewItems];
  return { dayObj, words, queue: words, reviewCount };
}

const FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

const GRAMMAR_TOTAL = GRAMMAR_DAYS.length;

const KWIZIQ_DAYS = [{"d":1,"w":1,"x":"Conjugate être in the present tense in French (Le Présent); subject pronouns je, tu, il, elle, vous"},{"d":2,"w":1,"x":"Conjugate avoir in the present tense in French (Le Présent); C'est vs il/elle est; elision with je/j'"},{"d":3,"w":1,"x":"Un/une = A or An (French Indefinite Articles); le/la/l'/les; noun gender"},{"d":4,"w":1,"x":"Conjugate regular -er verbs in the present tense in French (Le Présent)"},{"d":5,"w":1,"x":"Cities: à; countries: en/au/aux; habiter à/en/au/aux"},{"d":6,"w":1,"x":"Ne ... pas = Not - with simple tenses; basic rising-intonation questions"},{"d":7,"w":1,"x":"Review Week 1 Kwiziq lessons; take a 10-question mixed kwiz"},{"d":8,"w":2,"x":"Plural of nouns: adding -s; un/une/des; c'est vs ce sont"},{"d":9,"w":2,"x":"Mon, ma, mes; ton, ta, tes; son, sa, ses = my; your; his/her"},{"d":10,"w":2,"x":"Adjective agreement: regular masculine/feminine and singular/plural"},{"d":11,"w":2,"x":"Colour descriptions change according to gender and number (French Colour Adjectives)"},{"d":12,"w":2,"x":"Il y a = There is/There are in French; dans/sur/sous/devant/derrière"},{"d":13,"w":2,"x":"Numbers 0-100; dates with le; asking/telling phone numbers"},{"d":14,"w":2,"x":"Mixed review: articles, plurals, possession, adjectives, il y a"},{"d":15,"w":3,"x":"Telling time in French; à + clock time; days of the week"},{"d":16,"w":3,"x":"Conjugate faire in the present tense in French (Le Présent); faire du/de la/de l'"},{"d":17,"w":3,"x":"Expressing current actions, habits and situations with Le Présent; common routine -er verbs"},{"d":18,"w":3,"x":"Conjugate reflexive verbs in the present tense; se lever, se laver, s'habiller, se coucher"},{"d":19,"w":3,"x":"Aimer/aimer bien/adorer/détester + noun or infinitive; definite articles for general likes"},{"d":20,"w":3,"x":"Questions with qui, que/qu'est-ce que, où, quand, comment, pourquoi, combien"},{"d":21,"w":3,"x":"Mixed kwiz: time, faire, routine, reflexives, preferences, questions"},{"d":22,"w":4,"x":"Du/de la/de l'/des = Some/any (French Partitive Articles)"},{"d":23,"w":4,"x":"Conjugate vouloir in the present tense; je voudrais as a polite request"},{"d":24,"w":4,"x":"Expressions of quantity + de; combien coûte/coûtent; numbers and euros/dollars"},{"d":25,"w":4,"x":"Un/une become de/d' in negative sentences; partitives become de/d' after negation"},{"d":26,"w":4,"x":"Conjugate prendre in the present tense in French (Le Présent); prendre le petit déjeuner"},{"d":27,"w":4,"x":"Polite requests, s'il vous plaît, l'addition; review vouloir/prendre"},{"d":28,"w":4,"x":"Mixed kwiz: food articles, vouloir, prendre, quantity and negation"},{"d":29,"w":5,"x":"Conjugate aller in the present tense in French (Le Présent); au/à la/à l'/aux"},{"d":30,"w":5,"x":"Imperative-like direction chunks: allez, tournez, continuez; à droite/à gauche/tout droit"},{"d":31,"w":5,"x":"Conjugate verbs in the near future using aller + infinitive (Le Futur Proche)"},{"d":32,"w":5,"x":"Basic weather with il fait/il y a; seasons; choosing activities"},{"d":33,"w":5,"x":"Vouloir/pouvoir basics; accepter/refuser: oui, avec plaisir / désolé, je ne peux pas"},{"d":34,"w":5,"x":"Cumulative A0-A1 review: être, avoir, -er, faire, aller, articles, adjectives, negation, questions"},{"d":35,"w":5,"x":"Take an A1 Kwiziq level/checkpoint test; inspect Brainmap gaps rather than chasing 100%"},{"d":36,"w":6,"x":"Using le, la, les with body parts and clothing (French Definite Articles)"},{"d":37,"w":6,"x":"Avoir mal à + body part; avoir chaud/froid/faim/soif"},{"d":38,"w":6,"x":"Conjugate pouvoir in the present tense in French (Le Présent)"},{"d":39,"w":6,"x":"Conjugate devoir in the present tense in French (Le Présent)"},{"d":40,"w":6,"x":"Conjugate venir/tenir in the present tense; venir à/from places"},{"d":41,"w":6,"x":"Il faut + infinitive; frequency adverbs toujours/souvent/parfois/jamais"},{"d":42,"w":6,"x":"Mixed kwiz: body, pouvoir, devoir, health expressions"},{"d":43,"w":7,"x":"Definite articles contract with à and de in French (French Contracted Articles)"},{"d":44,"w":7,"x":"À/en + transport; prendre + means of transport"},{"d":45,"w":7,"x":"Imperative with vous: regular and common forms"},{"d":46,"w":7,"x":"Vouloir/pouvoir/devoir review in formal requests"},{"d":47,"w":7,"x":"Comparatives with plus...que, moins...que, aussi...que"},{"d":48,"w":7,"x":"Est-ce que and inversion with common question words"},{"d":49,"w":7,"x":"Mixed kwiz: contractions, transport, imperative, comparisons, questions"},{"d":50,"w":8,"x":"Forming the past participle of regular -er verbs; Passé Composé with avoir"},{"d":51,"w":8,"x":"Passé Composé with avoir: eu, fait, pris, vu, lu, bu"},{"d":52,"w":8,"x":"Ne ... pas = Not - with compound tenses"},{"d":53,"w":8,"x":"Asking questions in Le Passé Composé with est-ce que and inversion"},{"d":54,"w":8,"x":"Using d'abord, puis, ensuite, après, enfin with past events"},{"d":55,"w":8,"x":"Recognising present vs Passé Composé in context"},{"d":56,"w":8,"x":"Mixed kwiz: Passé Composé with avoir, negation and questions"},{"d":57,"w":9,"x":"Futur Proche review; expressions of future time"},{"d":58,"w":9,"x":"Polite requests with je voudrais, pouvoir and condition-like chunks"},{"d":59,"w":9,"x":"Using il y a / ne...pas and pouvoir to explain problems"},{"d":60,"w":9,"x":"Time, schedules and partir/arriver vocabulary"},{"d":61,"w":9,"x":"Passé Composé with être: aller, venir, arriver, partir, entrer, sortir"},{"d":62,"w":9,"x":"Choosing avoir or être in Le Passé Composé"},{"d":63,"w":9,"x":"Mixed kwiz: futur proche, travel language, Passé Composé avoir/être"},{"d":64,"w":10,"x":"Using le/la/les with professions and c'est vs il/elle est"},{"d":65,"w":10,"x":"Savoir vs connaître; pouvoir + infinitive"},{"d":66,"w":10,"x":"Devoir, pouvoir and il faut in workplace rules"},{"d":67,"w":10,"x":"Present, Passé Composé and Futur Proche in one message"},{"d":68,"w":10,"x":"Formal and informal address: tu vs vous; common email formulas"},{"d":69,"w":10,"x":"Depuis + present for an action continuing now; duration expressions"},{"d":70,"w":10,"x":"Take an A1/A2 boundary checkpoint; review Brainmap gaps"},{"d":71,"w":11,"x":"Adjective agreement review with clothing; demonstratives ce/cet/cette/ces"},{"d":72,"w":11,"x":"Position of French adjectives: common adjectives before and after nouns"},{"d":73,"w":11,"x":"Comparatives plus/moins/aussi and superlatives le plus/le moins"},{"d":74,"w":11,"x":"Le/la/les = it/him/her/them as direct object pronouns"},{"d":75,"w":11,"x":"Past tense plus present requests in a complaint"},{"d":76,"w":11,"x":"Relative pronouns qui and que: basic descriptions"},{"d":77,"w":11,"x":"Mixed kwiz: demonstratives, adjective position, comparisons, COD pronouns, qui/que"},{"d":78,"w":12,"x":"C'est/il est and adjective agreement to describe accommodation"},{"d":79,"w":12,"x":"Abbreviations and quantity expressions in housing ads"},{"d":80,"w":12,"x":"Question formation review with combien, quel, est-ce que"},{"d":81,"w":12,"x":"Recent past venir de + infinitive and futur proche"},{"d":82,"w":12,"x":"Faire causative chunks and devoir/pouvoir for repair requests"},{"d":83,"w":12,"x":"Imperative and polite requests; noise/time expressions"},{"d":84,"w":12,"x":"Mixed kwiz: housing, questions, recent past, current action and future"},{"d":85,"w":13,"x":"Le Futur Simple: regular -er/-ir verbs"},{"d":86,"w":13,"x":"Le Futur Simple: être, avoir, aller, faire, pouvoir, vouloir"},{"d":87,"w":13,"x":"Tu/vous register and invitation formulas"},{"d":88,"w":13,"x":"Futur proche vs futur simple; because/therefore connectors"},{"d":89,"w":13,"x":"Si + présent, futur simple for likely conditions"},{"d":90,"w":13,"x":"On/nous and sequencing decisions"},{"d":91,"w":13,"x":"Mixed kwiz: futur simple, irregular stems, si clauses and register"},{"d":92,"w":14,"x":"Pour + infinitive to express purpose"},{"d":93,"w":14,"x":"Negative expressions ne...plus, ne...jamais, ne...rien"},{"d":94,"w":14,"x":"Imperative affirmative/negative with common verbs"},{"d":95,"w":14,"x":"Recent past and passé composé to report an event"},{"d":96,"w":14,"x":"Opinion verbs penser que, croire que, trouver que"},{"d":97,"w":14,"x":"Reported content with dire que; indirect information"},{"d":98,"w":14,"x":"Mixed kwiz: purpose, negations, imperative, opinions and dire que"},{"d":99,"w":15,"x":"Penser que/croire que/trouver que with indicative"},{"d":100,"w":15,"x":"Moi aussi/moi non plus/si for responses"},{"d":101,"w":15,"x":"Parce que, car, donc, c'est pourquoi"},{"d":102,"w":15,"x":"D'un côté/de l'autre; mais/pourtant"},{"d":103,"w":15,"x":"Answer frame: opinion + reason + example + conclusion"},{"d":104,"w":15,"x":"Cumulative review: present, past, future, pronouns, comparisons and connectors"},{"d":105,"w":15,"x":"Take an A2 diagnostic/checkpoint and inspect Brainmap by topic"},{"d":106,"w":16,"x":"Forming L'Imparfait from the nous-form stem"},{"d":107,"w":16,"x":"Using L'Imparfait for repeated past actions and habits"},{"d":108,"w":16,"x":"Using L'Imparfait for weather, time, feelings and descriptions"},{"d":109,"w":16,"x":"Passé Composé vs L'Imparfait: completed event and background"},{"d":110,"w":16,"x":"Passé Composé vs L'Imparfait in a connected narrative"},{"d":111,"w":16,"x":"Questions in imparfait: où, comment, qu'est-ce que"},{"d":112,"w":16,"x":"Mixed kwiz: imparfait formation and passé composé contrast"},{"d":113,"w":17,"x":"Possessive and demonstrative adjectives in administrative contexts"},{"d":114,"w":17,"x":"Depuis, pendant, pour, il y a with time expressions"},{"d":115,"w":17,"x":"Indirect questions with je voudrais savoir si/où/quand"},{"d":116,"w":17,"x":"Cause and consequence connectors: parce que, à cause de, donc"},{"d":117,"w":17,"x":"Pronoun en for quantities and de-phrases: introductory use"},{"d":118,"w":17,"x":"Object pronouns le/la/les and en in formal exchanges"},{"d":119,"w":17,"x":"Mixed kwiz: time expressions, indirect questions, cause and pronouns"},{"d":120,"w":18,"x":"Adjective agreement and nuanced descriptions"},{"d":121,"w":18,"x":"Se sentir, rendre + adjective and avoir peur de"},{"d":122,"w":18,"x":"Conditional politeness chunks: tu devrais/vous devriez"},{"d":123,"w":18,"x":"Past explanations plus conditional repair offers"},{"d":124,"w":18,"x":"Pronouns y and en in common place/quantity chunks"},{"d":125,"w":18,"x":"Concession with même si and pourtant"},{"d":126,"w":18,"x":"Mixed kwiz: feelings, advice, apology, y/en and concession"},{"d":127,"w":19,"x":"Relative pronouns qui/que/où in descriptions"},{"d":128,"w":19,"x":"Il faut/on doit and negative imperatives for rules"},{"d":129,"w":19,"x":"Faire + infinitive and laisser + infinitive: basic causal chunks"},{"d":130,"w":19,"x":"Comparisons and quantities: moins de/plus de/autant de"},{"d":131,"w":19,"x":"Future and past forms in forecasts and reports"},{"d":132,"w":19,"x":"Conditional request and future benefit: on pourrait, cela permettrait"},{"d":133,"w":19,"x":"Mixed kwiz: relative pronouns, rules, comparisons and conditional suggestions"},{"d":134,"w":20,"x":"Past-tense review with narrative connectors"},{"d":135,"w":20,"x":"Passive-like on constructions and sequence markers"},{"d":136,"w":20,"x":"Superlatives and recommendation structures"},{"d":137,"w":20,"x":"Conditional suggestions and consequence connectors"},{"d":138,"w":20,"x":"Cumulative oral structures: describe, narrate, compare, advise"},{"d":139,"w":20,"x":"Cumulative written accuracy: tense, pronouns, agreement and connectors"},{"d":140,"w":20,"x":"Take a full A2 checkpoint; inspect readiness for B1 content"},{"d":141,"w":21,"x":"Penser/croire/trouver que; indicative after statements of opinion"},{"d":142,"w":21,"x":"Adverbs of degree and restriction: assez, plutôt, surtout, seulement"},{"d":143,"w":21,"x":"Illustration connectors: notamment, comme, par exemple"},{"d":144,"w":21,"x":"Concession: bien que introductory recognition; même si; pourtant"},{"d":145,"w":21,"x":"Tandis que/alors que/en revanche for contrast"},{"d":146,"w":21,"x":"Oral turn-taking and rebuttal formulas"},{"d":147,"w":21,"x":"Mixed kwiz: opinion verbs, nuance, concession and contrast"},{"d":148,"w":22,"x":"Present tense plus depuis for continuing responsibilities"},{"d":149,"w":22,"x":"Subjunctive chunks after il faut que/je veux que: recognition and core forms"},{"d":150,"w":22,"x":"Devoir, avoir besoin de, il vaut mieux and priority expressions"},{"d":151,"w":22,"x":"Past/present/future in a concise status update"},{"d":152,"w":22,"x":"Conditional present for polite/professional recommendations"},{"d":153,"w":22,"x":"Formal request, conditional politeness and follow-up formulas"},{"d":154,"w":22,"x":"Mixed kwiz: depuis, meeting chunks, conditional recommendations and formal register"},{"d":155,"w":23,"x":"Passive voice recognition with être + past participle"},{"d":156,"w":23,"x":"Reported information with selon/d'après and dire que"},{"d":157,"w":23,"x":"Markers of certainty and uncertainty"},{"d":158,"w":23,"x":"Complex cause/consequence: puisque, en raison de, entraîner"},{"d":159,"w":23,"x":"Quantities and proportions: la majorité, un tiers, deux fois plus"},{"d":160,"w":23,"x":"Emotional reaction plus reason and cautious prediction"},{"d":161,"w":23,"x":"Mixed kwiz: passive recognition, reporting, uncertainty and quantities"},{"d":162,"w":24,"x":"Future forms and time clauses quand/lorsque + future"},{"d":163,"w":24,"x":"Past narrative plus conditional requests"},{"d":164,"w":24,"x":"Plus-que-parfait recognition for an earlier past action"},{"d":165,"w":24,"x":"Relative pronouns and formal complaint organization"},{"d":166,"w":24,"x":"Relative clauses and superlatives in recommendations"},{"d":167,"w":24,"x":"Past tenses including introductory plus-que-parfait"},{"d":168,"w":24,"x":"Mixed kwiz: future clauses, past chronology, complaints and relative clauses"},{"d":169,"w":25,"x":"Connector review and paragraph functions"},{"d":170,"w":25,"x":"Reported speech with dire/expliquer/ajouter que"},{"d":171,"w":25,"x":"Oral structure and self-correction phrases"},{"d":172,"w":25,"x":"Clarifying, negotiating and confirming formulas"},{"d":173,"w":25,"x":"B1 email organization and register"},{"d":174,"w":25,"x":"Cumulative B1 grammar selected from error log"},{"d":175,"w":25,"x":"Take a B1 diagnostic; compare results with Week 20"},{"d":176,"w":26,"x":"Ce qui/ce que as subjects and objects in argumentation"},{"d":177,"w":26,"x":"Grâce à/à cause de; permettre de/contribuer à"},{"d":178,"w":26,"x":"Certes...mais; pourtant; cependant"},{"d":179,"w":26,"x":"Pronouns y/en and celui-ci/celle-ci to avoid repetition"},{"d":180,"w":26,"x":"Conditional plus modal verbs for proposals"},{"d":181,"w":26,"x":"Agreement, tense and pronoun error correction at B1"},{"d":182,"w":26,"x":"Mixed kwiz: ce qui/ce que, connectors, pronouns and conditional proposals"},{"d":183,"w":27,"x":"Indirect questions and reformulation"},{"d":184,"w":27,"x":"Relative clauses and purpose/result structures"},{"d":185,"w":27,"x":"Percentage and change expressions; conditional estimates"},{"d":186,"w":27,"x":"Concession and reassurance with conditional solutions"},{"d":187,"w":27,"x":"Future and condition structures in action plans"},{"d":188,"w":27,"x":"Reported decisions and commitments"},{"d":189,"w":27,"x":"Mixed kwiz: indirect questions, conditional value, concession and reported decisions"},{"d":190,"w":28,"x":"Il faut/devoir/être tenu de/avoir le droit de"},{"d":191,"w":28,"x":"Passive voice and administrative vocabulary"},{"d":192,"w":28,"x":"Formal chronology and requested remedy"},{"d":193,"w":28,"x":"Although/despite and conditional politeness"},{"d":194,"w":28,"x":"Subjunctive after il est important que; core recognition/use"},{"d":195,"w":28,"x":"Definition and example frames"},{"d":196,"w":28,"x":"Mixed kwiz: obligation, passive, concession and formal requests"},{"d":197,"w":29,"x":"Frequency and duration review at B1"},{"d":198,"w":29,"x":"Past tenses and depuis in health chronology"},{"d":199,"w":29,"x":"Conditional and imperative in recommendations"},{"d":200,"w":29,"x":"Cause, effect and coping suggestions"},{"d":201,"w":29,"x":"Certainty, evidence and cautious language"},{"d":202,"w":29,"x":"Future goals and conditionals for realistic planning"},{"d":203,"w":29,"x":"Mixed kwiz: past health timeline, conditional advice and evidence language"},{"d":204,"w":30,"x":"Combining information from two short texts"},{"d":205,"w":30,"x":"Abbreviations and reformulation for efficient notes"},{"d":206,"w":30,"x":"Signposting and audience-friendly transitions"},{"d":207,"w":30,"x":"Clarification, objection and compromise review"},{"d":208,"w":30,"x":"Full B1 argumentative organization"},{"d":209,"w":30,"x":"Targeted review from error log only"},{"d":210,"w":30,"x":"Take a mid-B1 diagnostic and compare with Week 25"},{"d":211,"w":31,"x":"Passé Composé, Imparfait and Plus-que-Parfait in chronological narratives"},{"d":212,"w":31,"x":"Indirect speech in the present and past: dire que, demander si"},{"d":213,"w":31,"x":"Connectors of suddenness, simultaneity and delay"},{"d":214,"w":31,"x":"Faire causative and responsibility expressions"},{"d":215,"w":31,"x":"Past conditional: j'aurais dû/pu/voulu for regrets"},{"d":216,"w":31,"x":"Narrative signposting and clarification under interaction"},{"d":217,"w":31,"x":"Mixed kwiz: three past tenses, reported speech and past conditional"},{"d":218,"w":32,"x":"Past and present-perfect-style chronology in French"},{"d":219,"w":32,"x":"Gerund en + present participle for manner"},{"d":220,"w":32,"x":"Comparatives, superlatives and criteria weighting"},{"d":221,"w":32,"x":"Relative clauses and achievement-result statements"},{"d":222,"w":32,"x":"Future, conditional aspirations and conditions"},{"d":223,"w":32,"x":"Complex answer frame: claim, evidence, relevance"},{"d":224,"w":32,"x":"Mixed kwiz: gerund, relative clauses, comparisons and career conditionals"},{"d":225,"w":33,"x":"Definitions with qui/que/ce qui; analogy and example"},{"d":226,"w":33,"x":"D'un côté/de l'autre; tout en + present participle"},{"d":227,"w":33,"x":"Passive and obligation structures in policy language"},{"d":228,"w":33,"x":"Cause, risk and mitigation language"},{"d":229,"w":33,"x":"Uncertainty, source attribution and reported speech"},{"d":230,"w":33,"x":"Subjunctive after il faut que and purpose pour que"},{"d":231,"w":33,"x":"Mixed kwiz: relative explanation, passive, uncertainty and subjunctive chunks"},{"d":232,"w":34,"x":"Nominalization recognition and precise cause language"},{"d":233,"w":34,"x":"Reported viewpoints and contrast"},{"d":234,"w":34,"x":"Hypothesis with si; conditional outcomes"},{"d":235,"w":34,"x":"Although/even if/despite; balancing language"},{"d":236,"w":34,"x":"Future passive and sequencing for action plans"},{"d":237,"w":34,"x":"Rhetorical signposting and audience questions"},{"d":238,"w":34,"x":"Mixed kwiz: reported viewpoints, hypotheses, concession and passive"},{"d":239,"w":35,"x":"Neutral reporting and contrast across three sources"},{"d":240,"w":35,"x":"Inference and attitude markers"},{"d":241,"w":35,"x":"Advanced signposting, counterpoint and synthesis"},{"d":242,"w":35,"x":"Clarification, qualification and repair strategies"},{"d":243,"w":35,"x":"Separate source summary from personal argument"},{"d":244,"w":35,"x":"Targeted B1+ grammar from error log"},{"d":245,"w":35,"x":"Take a B1+/early-B2 diagnostic and compare with Week 30"},{"d":246,"w":36,"x":"Discourse connectors: d'abord, en outre, toutefois, en conclusion"},{"d":247,"w":36,"x":"Restriction and emphasis: ne...que, surtout, même, seulement"},{"d":248,"w":36,"x":"Certainty, doubt, approval and criticism markers"},{"d":249,"w":36,"x":"Hypothesis and inference: il se peut que, cela laisse penser que"},{"d":250,"w":36,"x":"Complex quantities, ranges, fractions and conditions"},{"d":251,"w":36,"x":"Abbreviation, symbol and paraphrase system"},{"d":252,"w":36,"x":"Mixed review: discourse, restriction, uncertainty and numbers"},{"d":253,"w":37,"x":"Formal questions, indirect questions and follow-ups"},{"d":254,"w":37,"x":"Conditional proposals and benefit framing"},{"d":255,"w":37,"x":"Clarification and active-listening questions"},{"d":256,"w":37,"x":"Certes...mais, même si and conditional alternatives"},{"d":257,"w":37,"x":"Conditional, future and concession in extended interaction"},{"d":258,"w":37,"x":"Rhythm groups, liaison and discourse-marker stress"},{"d":259,"w":37,"x":"Review question, persuasion and interaction structures"},{"d":260,"w":38,"x":"Instruction verbs and required content"},{"d":261,"w":38,"x":"Polite conditional, formal connectors and precise requests"},{"d":262,"w":38,"x":"Narrative consistency, viewpoint and resolution"},{"d":263,"w":38,"x":"Thesis, counterargument, rebuttal and conclusion"},{"d":264,"w":38,"x":"Attribution, paraphrase and separation of source ideas"},{"d":265,"w":38,"x":"High-impact editing priorities"},{"d":266,"w":38,"x":"Targeted Kwiziq review from written error log"},{"d":267,"w":39,"x":"Text-type and purpose vocabulary"},{"d":268,"w":39,"x":"Reference words and lexical fields"},{"d":269,"w":39,"x":"Cause, contrast, concession and consequence connectors"},{"d":270,"w":39,"x":"Word families, prefixes, suffixes and collocation clues"},{"d":271,"w":39,"x":"Evaluation language and rhetorical choices"},{"d":272,"w":39,"x":"Mixed B2 reading structures from current errors"},{"d":273,"w":39,"x":"Review connector, reference and inference weaknesses"},{"d":274,"w":40,"x":"Targeted grammar review from listening transcript errors"},{"d":275,"w":40,"x":"Targeted grammar review from reading errors"},{"d":276,"w":40,"x":"Range and accuracy review from transcript"},{"d":277,"w":40,"x":"Error categories in a timed formal and opinion task"},{"d":278,"w":40,"x":"Personalized Kwiziq lessons from the four diagnostics"},{"d":279,"w":40,"x":"No new grammar; apply strategy under realistic limits"},{"d":280,"w":40,"x":"Review diagnostic evidence and choose Weeks 41-43 focus"},{"d":281,"w":41,"x":"Targeted pronunciation/grammar lessons from transcript errors"},{"d":282,"w":41,"x":"Uncertainty and attitude markers from the error log"},{"d":283,"w":41,"x":"Connectors and pronoun reference from the reading error log"},{"d":284,"w":41,"x":"No new grammar; apply skim-scan-verify method"},{"d":285,"w":41,"x":"Automatic connector and reformulation chunks"},{"d":286,"w":41,"x":"Personalized Kwiziq review of top two written grammar errors"},{"d":287,"w":41,"x":"Retest only the repaired grammar and comprehension categories"},{"d":288,"w":42,"x":"No new grammar before the mock"},{"d":289,"w":42,"x":"No new grammar before the mock"},{"d":290,"w":42,"x":"No new grammar; activate prepared interaction structures"},{"d":291,"w":42,"x":"No new grammar; use the established planning and editing process"},{"d":292,"w":42,"x":"Review only grammar errors evidenced by the mock"},{"d":293,"w":42,"x":"No new lessons before the simulation"},{"d":294,"w":42,"x":"Targeted review of Mock 2 errors only"},{"d":295,"w":43,"x":"Review only one high-value listening pattern"},{"d":296,"w":43,"x":"Review only one high-value reading pattern"},{"d":297,"w":43,"x":"Activate connectors and interaction phrases; no new structures"},{"d":298,"w":43,"x":"Activate templates and editing checklist; no new grammar"},{"d":299,"w":43,"x":"No new grammar"},{"d":300,"w":43,"x":"Review only mature Anki cards; add no new cards"},{"d":301,"w":43,"x":"No new grammar; final reflection only"}];
const KWIZIQ_TOTAL = KWIZIQ_DAYS.length;

const WRITING_DAYS = [{"d":1,"w":1,"x":"Write 5-6 lines introducing yourself. Include your name, city, profession, nationality and one greeting. Start: Bonjour, je m'appelle... Check: je/j', à before Toronto, and suis after je."},{"d":2,"w":1,"x":"Create a personal-information card in 6 lines: name, age, city, job, telephone placeholder and email placeholder. Use J'ai for age, never Je suis. Check apostrophes in j'ai/j'habite."},{"d":3,"w":1,"x":"Write 10 noun phrases with an article, then turn any 5 into C'est... sentences. Use at least four masculine and four feminine nouns. Check every noun has un/une or le/la/l'."},{"d":4,"w":1,"x":"Write 8 sentences: two with parler, two with habiter, two with travailler and two with aimer. Use je, tu and vous at least once. Check the -er endings: je -e, tu -es, vous -ez."},{"d":5,"w":1,"x":"Write 6 location sentences about yourself and imaginary people. Include one city and examples with en, au and aux. Check that cities use à and that each country has the correct preposition."},{"d":6,"w":1,"x":"Write 5 positive statements and make each one negative. Then write 4 personal questions using où, comment, quel/quelle and est-ce que. Check ne/n' comes before the verb and pas after it."},{"d":7,"w":1,"x":"Write a 70-word profile in one paragraph. Include greeting, identity, age, city, work, languages and one like/dislike. Underline être/avoir verbs and circle articles; then correct two errors yourself."},{"d":8,"w":2,"x":"Describe an imaginary family in 8 sentences. Name at least six people and use C'est twice, Ce sont once and Ils/Elles sont once. Check singular versus plural articles and verbs."},{"d":9,"w":2,"x":"Write 10 ownership sentences about family and objects. Use mon, ma, mes, ton, ta, son, sa and ses at least once. Check the possessive agrees with the following noun."},{"d":10,"w":2,"x":"Write 60 words describing one person: relationship, name, appearance and three personality traits. Use at least five adjectives. Check feminine -e and plural -s where required."},{"d":11,"w":2,"x":"Describe clothing for two people in 8 sentences. Give each person at least three items and three colors. Check that color adjectives agree with the clothing noun."},{"d":12,"w":2,"x":"Write 70 words describing one room. Mention at least eight objects and use il y a plus five different location expressions. Check de + le becomes du in à côté du."},{"d":13,"w":2,"x":"Write five dates and a short phone-number exchange. Spell out two numbers in words and include your birthday. Check le before dates and clear number grouping."},{"d":14,"w":2,"x":"Write 90 words titled Ma famille et ma maison. Paragraph 1: four family facts. Paragraph 2: rooms, objects and location. Use et, mais and parce que; check articles and adjective agreement."},{"d":15,"w":3,"x":"Create a weekday timetable with six events and times. Then write one sentence for each event. Use le matin, l'après-midi and le soir. Check 24-hour numbers and à before each time."},{"d":16,"w":3,"x":"Write 8 leisure sentences: four about you and four about another person. Include faire, jouer and aimer. Add when or where for four activities. Check faire forms and du/de la."},{"d":17,"w":3,"x":"Write 80 words titled Ma journée typique. Organize morning, afternoon and evening using d'abord, puis, ensuite and enfin. Include at least six present-tense verbs; check subject-verb endings."},{"d":18,"w":3,"x":"Write 8 routine sentences: four morning and four evening. Use at least four reflexive verbs and two times. Check the reflexive pronoun appears before each conjugated verb."},{"d":19,"w":3,"x":"Write 10 preference sentences about food, sports, music and learning. Rank from détester to adorer and give two reasons with parce que. Check le/la/les before general nouns."},{"d":20,"w":3,"x":"Write 10 interview questions for a new colleague. Use each question word at least once, then add short sample answers. Check the question mark and logical match between question and answer."},{"d":21,"w":3,"x":"Write 100 words titled Ma journée et mes loisirs. Use two paragraphs, six time markers, two reflexive verbs and three leisure activities. Check sequence, repetition and verb endings."},{"d":22,"w":4,"x":"Write a one-day meal plan in 10 sentences: breakfast, lunch, dinner and snacks. Use du, de la, de l' and des at least once. Check the article before every food."},{"d":23,"w":4,"x":"Write a 10-line café dialogue. Include greeting, two items, one customization, price, thanks and goodbye. Label Serveur and Client; check polite je voudrais rather than only je veux."},{"d":24,"w":4,"x":"Make a shopping list of eight items with quantities. Then write a six-line buyer-seller exchange containing two prices and one question. Check quantity expressions always use de/d'."},{"d":25,"w":4,"x":"Write 8 positive food sentences and convert each to negative. Include avoir, manger, vouloir and il y a. Highlight de/d' after negation and note why ce n'est pas un keeps un."},{"d":26,"w":4,"x":"Write 80 words about your normal meals. Use five different forms of prendre, three times and six food words. Check prends/prend/prenons/prenez/prennent."},{"d":27,"w":4,"x":"Write a 12-line restaurant dialogue with arrival, drinks, starter/main choice, one missing item, dessert, bill and goodbye. Use at least three polite requests and check punctuation."},{"d":28,"w":4,"x":"Write 110 words in two parts: your normal meals, then a café visit. Include one quantity, two prices, one negative sentence and three polite requests. Check partitives and de after negation."},{"d":29,"w":5,"x":"Write 10 sentences about destinations and transport. Use all six forms of aller, plus au, à la, à l' and aux. Check en + vehicle but à pied."},{"d":30,"w":5,"x":"Write eight numbered directions from your home to a nearby place. Include a starting point, three action verbs, two landmarks and an arrival sentence. Check vous-command forms ending in -ez."},{"d":31,"w":5,"x":"Write 10 near-future plans for tonight, tomorrow and the weekend. Use five different subjects and at least seven infinitives. Check conjugated aller + unchanged infinitive."},{"d":32,"w":5,"x":"Write a three-day forecast. For each day, give weather, temperature description and one suitable future activity. Use aujourd'hui, demain and après-demain; check il fait versus il y a."},{"d":33,"w":5,"x":"Write two 8-line dialogues: accept one invitation and politely refuse another. Each must specify activity, day, time and place. Check question forms and je ne peux pas."},{"d":34,"w":5,"x":"Write 120 words in three mini-paragraphs: who you are, your weekday, and your next weekend. Include one negative, one question, one direction and two futur proche sentences. Self-correct five target grammar points."},{"d":35,"w":5,"x":"Timed 120-140 word personal email. Greet a new French-speaking friend; introduce yourself, describe family/routine, propose a weekend activity, give day/time/place, and close politely. Check verbs, articles, agreement, accents and word count."},{"d":36,"w":6,"x":"Draw or list a person and write 10 labelled body-part sentences. Add two J'ai mal... sentences. Check le/la/les with every body part."},{"d":37,"w":6,"x":"Write an 8-sentence symptom note: when it started, four symptoms and two things you cannot do. Check avoir for pain/fever and être for malade/fatigué."},{"d":38,"w":6,"x":"Write a 10-line pharmacist-customer dialogue. Include symptoms, a request, dosage question and thanks. Check pouvez-vous and polite vous forms."},{"d":39,"w":6,"x":"Write six pieces of advice for a person with a cold. Use devoir three times and il faut twice. Add one negative instruction; check infinitives after devoir/il faut."},{"d":40,"w":6,"x":"Write a 10-line phone dialogue to book an appointment. Include two offered times, one refusal, one acceptance and confirmation. Check dates and formal vous."},{"d":41,"w":6,"x":"Write 90 words about your health habits. Include three good habits, two habits to improve and three frequency adverbs. End with two goals using je vais."},{"d":42,"w":6,"x":"Write a 110-word message to your manager explaining illness, symptoms, medical appointment and expected return. Use a greeting and polite closing; check tense consistency."},{"d":43,"w":7,"x":"Write 10 sentences describing your neighbourhood. Include six places, three location expressions and two contracted articles au/du. Check à + le = au and de + le = du."},{"d":44,"w":7,"x":"Write a 10-line ticket-counter dialogue. State destination, ticket type, price and departure time; ask where to change. Check prendre le bus but aller en bus."},{"d":45,"w":7,"x":"Write an 8-line post-office dialogue and a sample parcel label. Include destination country, weight question, stamps and payment. Check vous-imperative endings."},{"d":46,"w":7,"x":"Write a 10-line bank dialogue: purpose, identification, one problem, required action and closing. Use je voudrais, puis-je and je dois."},{"d":47,"w":7,"x":"Compare two neighbourhoods in 90 words. Discuss size, cost, transport, safety and atmosphere using plus, moins and aussi at least once each."},{"d":48,"w":7,"x":"Write eight questions for a tourist office, covering hours, price, location, transport and activities. Add short answers. Check question words and punctuation."},{"d":49,"w":7,"x":"Write a 120-word practical city guide for a newcomer. Include transport, three services, one comparison and four useful questions. Check contractions and formal register."},{"d":50,"w":8,"x":"Write eight sentences about yesterday using different -er verbs in passé composé. Add three time markers. Check avoir + past participle ending in -é."},{"d":51,"w":8,"x":"Write 10 past sentences using each irregular participle at least once. Include where and when for five actions. Check participle spelling; do not conjugate the participle."},{"d":52,"w":8,"x":"Write five things you did and five you did not do yesterday. Use pas, pas encore, jamais and rien. Check ne...pas surrounds avoir, not the participle."},{"d":53,"w":8,"x":"Write eight interview questions about last weekend and answer each in one full sentence. Use five different question words; check auxiliary-subject order."},{"d":54,"w":8,"x":"Write 100 words about yesterday in chronological order. Include at least eight past verbs and five sequence markers. Check that every event has an auxiliary."},{"d":55,"w":8,"x":"After the TV5 text/video, write a 6-sentence summary: who, where, when and four events. Use your own words and five passé composé forms."},{"d":56,"w":8,"x":"Write a 120-word account of your last weekend. Include 10 past verbs, two negatives, one question and five connectors. Proofread auxiliaries and participles."},{"d":57,"w":9,"x":"Write a five-day itinerary with destination, transport, accommodation and one activity per day. Use at least eight futur proche forms."},{"d":58,"w":9,"x":"Write a 12-line check-in dialogue. Include name, room type, nights, breakfast, Wi-Fi and one request. Check formal questions and numbers."},{"d":59,"w":9,"x":"Write a polite 10-line complaint dialogue with two problems, evidence, a requested solution and staff response. Use s'il vous plaît and merci."},{"d":60,"w":9,"x":"Create six timetable questions and answers, then write a short announcement about a 30-minute delay. Check times, partir de and arriver à."},{"d":61,"w":9,"x":"Write eight travel sentences with être verbs and different subjects. Mark agreement endings in color or brackets. Check auxiliary être and gender/number agreement."},{"d":62,"w":9,"x":"Write 120 words about a real or imaginary trip. Include five avoir verbs, three être verbs, weather, food and one problem. Check auxiliary choice and agreement."},{"d":63,"w":9,"x":"Write a 130-word email about a completed trip and a future trip. Use passé composé in paragraph 1 and futur proche in paragraph 2. Check tense separation."},{"d":64,"w":10,"x":"Write 100 words about your work: role, employer, workplace, three duties and typical schedule. Use present tense and six work words; check profession after être has no article."},{"d":65,"w":10,"x":"Write eight skill statements: three things you know how to do, two fields you know, two learning goals and one limitation. Check savoir + infinitive versus connaître + noun."},{"d":66,"w":10,"x":"Write a 10-item workplace guide: four obligations, two permissions, two prohibitions and two recommendations. Use devoir, pouvoir, il faut and il est interdit de."},{"d":67,"w":10,"x":"Write a 120-word project update with three headings: Terminé, En cours, Prochaines étapes. Include one problem and solution. Check past/present/future verb forms."},{"d":68,"w":10,"x":"Write a 100-word formal email requesting information about a French course. Include subject, greeting, reason, three questions, thanks and closing. Check vous throughout."},{"d":69,"w":10,"x":"Write 120 words reflecting on five weeks: progress in four skills, two difficulties, successful habits and three next goals. Use depuis, parce que and futur proche."},{"d":70,"w":10,"x":"Timed 140-160 word email to a French friend: introduce current life, recount last weekend, describe a problem and propose next-weekend plans. Check all three time frames and connectors."},{"d":71,"w":11,"x":"Write a 10-line clothing-store dialogue. Include item, color, size, fitting room, fit and price. Use ce, cet, cette and ces correctly."},{"d":72,"w":11,"x":"Describe four objects in 90 words. For each, give material/color, size, condition and use. Include adjectives both before and after nouns; check agreement."},{"d":73,"w":11,"x":"Compare three products in 100 words. Discuss price, quality, size and usefulness; use plus, moins, aussi and one superlative. End with a justified choice."},{"d":74,"w":11,"x":"Write eight noun sentences, then rewrite each using le, la, l' or les. Add a four-line mini-dialogue. Check pronoun placement before the verb."},{"d":75,"w":11,"x":"Write a 12-line return dialogue. State when you bought it, two problems, proof of purchase and preferred solution. Use passé composé plus polite requests."},{"d":76,"w":11,"x":"Write a 100-word online product review. Identify the item, delivery, quality, one advantage and one problem. Use qui twice and que twice."},{"d":77,"w":11,"x":"Write a 130-word buying story: comparison, decision, purchase and later opinion. Use present, past, one future sentence and three object pronouns."},{"d":78,"w":12,"x":"Write a 100-word ideal-home description. Include type, location, rooms, features, size and two non-negotiable needs. Use il y a and five adjectives."},{"d":79,"w":12,"x":"Create a complete rental ad in 90-110 words. Include title, location, rooms, features, rent, utilities, availability and contact instruction."},{"d":80,"w":12,"x":"Write 10 viewing questions and a short answer to each. Cover cost, utilities, rules, parking, transit, availability and lease. Check formal question structure."},{"d":81,"w":12,"x":"Write a 10-step moving-day timeline. Include two recent-past, two current-action and three near-future sentences. Label Avant, Maintenant and Après."},{"d":82,"w":12,"x":"Write a 110-word maintenance email. Include apartment identification, two problems, when they began, impact, availability and requested action. Use a formal closing."},{"d":83,"w":12,"x":"Write two 8-line neighbour dialogues: one complaint and one apology/solution. Keep the tone polite and include a specific time and compromise."},{"d":84,"w":12,"x":"Write 140 words comparing two apartments and announcing your decision. Include advantages, disadvantages, questions asked and next steps."},{"d":85,"w":13,"x":"Write eight future-simple predictions about next year: work, French, family, travel and health. Use five subjects and underline endings."},{"d":86,"w":13,"x":"Write 10 personal predictions using all six irregular verbs. Add three probability words. Check stems ser-, aur-, ir-, fer-, pourr-, voudr-."},{"d":87,"w":13,"x":"Write two invitations of 70-90 words: an informal message to a friend and a formal invitation to a colleague. Include purpose, date, time, place and RSVP."},{"d":88,"w":13,"x":"Write a 100-word rescheduling email. Explain the reason, apologize, offer two alternatives, ask for confirmation and close politely."},{"d":89,"w":13,"x":"Write six realistic si sentences about weekend plans, travel and study. Then create a 70-word plan A/plan B paragraph."},{"d":90,"w":13,"x":"Write a 12-line group-chat conversation among three people. Include two suggestions, one disagreement, compromise, task assignments and final confirmation."},{"d":91,"w":13,"x":"Write 140 words about a planned event that changes. Use past for the original decision, present for the problem and future for the solution."},{"d":92,"w":14,"x":"Write 100 words describing five devices/apps and what you use each for. Use pour + infinitive five times and one negative instruction."},{"d":93,"w":14,"x":"Write a 12-line support-chat dialogue. Describe device, error, when it began, three attempted steps and result. Use two negative expressions."},{"d":94,"w":14,"x":"Write eight numbered instructions for installing or using an app. Use six different imperatives, two negatives and sequence markers."},{"d":95,"w":14,"x":"Write an 80-100 word factual news brief from an imaginary event. Include headline, who, what, where, when and source. Avoid personal opinion."},{"d":96,"w":14,"x":"Write 110 words about your media habits. Give three opinions, two reasons, one advantage and one disadvantage. Use penser/trouver/croire que."},{"d":97,"w":14,"x":"Write six direct messages and report each using dire que or prévenir que. Then write a 60-word voicemail with name, reason, request and callback details."},{"d":98,"w":14,"x":"Write 140 words: describe a technical problem, instructions that solved it, and your opinion about the tool. Use past, imperative and opinion phrases."},{"d":99,"w":15,"x":"Write 120 words responding to: Est-il utile d'apprendre une langue en ligne ? Give position, two reasons, one example and a brief conclusion."},{"d":100,"w":15,"x":"Write a 12-line discussion between two people who partly disagree. Include two agreements, two disagreements, one concession and final compromise."},{"d":101,"w":15,"x":"Write eight cause-consequence pairs, then combine them into a 100-word paragraph about learning French. Use all six connectors correctly."},{"d":102,"w":15,"x":"Write 130 words on working from home: introduction, two advantages, two disadvantages, your position and conclusion. Use four organizing connectors."},{"d":103,"w":15,"x":"Choose three topics (transport, housing, learning). For each, write a 5-sentence answer using opinion, reason, example, contrast and conclusion."},{"d":104,"w":15,"x":"Write 150 words combining: current situation, a recent experience, a comparison and a future plan. Use at least six connectors and self-correct five errors."},{"d":105,"w":15,"x":"Timed 160-180 word email: recount a problem, explain how you solved it, compare two options and describe your future decision. Check present, past, future and paragraphing."},{"d":106,"w":16,"x":"Write 10 childhood sentences using être, avoir, faire, habiter and aller in imparfait. Add four frequency/time expressions; underline endings."},{"d":107,"w":16,"x":"Write 120 words comparing an old routine with your current routine. Use six imparfait verbs, six present verbs and comparison markers avant/maintenant."},{"d":108,"w":16,"x":"Describe the setting of a memory in 100 words: weather, time, place, people, sounds and feelings. Use at least eight imparfait forms."},{"d":109,"w":16,"x":"Write eight paired sentences: background in imparfait plus interrupting event in passé composé. Highlight each tense in a different way."},{"d":110,"w":16,"x":"Write a 130-word anecdote with setting, normal activity, unexpected event, reaction and ending. Use five imparfait and six passé composé verbs."},{"d":111,"w":16,"x":"Write eight childhood interview questions and answer each in 2-3 sentences. Include home, school, friends, games and holidays."},{"d":112,"w":16,"x":"Write 150 words retelling an event with a clear background, trigger, sequence and ending. Self-check every past-tense choice."},{"d":113,"w":17,"x":"Create a sample form profile with 12 fields, then write six questions about required documents. Use fictional numbers only."},{"d":114,"w":17,"x":"Write eight administrative timeline sentences using depuis, pendant, pour and il y a twice each. Add a deadline and expiry date."},{"d":115,"w":17,"x":"Write a 120-word formal inquiry email with context, four indirect questions, requested next step, thanks and closing."},{"d":116,"w":17,"x":"Write a 120-word explanation of a missed deadline. Include cause, consequence, responsibility, solution and new date; keep the tone professional."},{"d":117,"w":17,"x":"Write eight numbered application instructions. Include documents, quantities, submission, confirmation and record keeping. Use en twice."},{"d":118,"w":17,"x":"Write a 12-line phone dialogue: identify yourself, give file number, ask status, clarify missing item and agree on next action."},{"d":119,"w":17,"x":"Write a 150-word formal follow-up email referencing submission date, documents, current delay, four questions and desired resolution."},{"d":120,"w":18,"x":"Write 120 words describing two people and your relationship with each. Use eight traits, examples of behavior and one contrast."},{"d":121,"w":18,"x":"Write 100 words about an emotional event: situation, initial feeling, reason, reaction and final feeling. Use past and present."},{"d":122,"w":18,"x":"Write a 120-word advice message to a stressed friend. Acknowledge feelings, give four suggestions with reasons and offer support."},{"d":123,"w":18,"x":"Write a 100-word apology: name the action, accept responsibility, explain briefly without excuses, offer repair and promise a change."},{"d":124,"w":18,"x":"Write a hosting plan with 10 tasks assigned to three people. Use futur simple/proche, y twice and en twice."},{"d":125,"w":18,"x":"Write a 12-line disagreement dialogue. Include two viewpoints, clarification, concession, two proposed solutions and a compromise."},{"d":126,"w":18,"x":"Write a 160-word story about a misunderstanding and resolution. Include background, event, feelings, apology, advice and outcome."},{"d":127,"w":19,"x":"Write a 130-word neighbourhood profile using qui, que and où twice each. Mention strengths, missing service and one recommendation."},{"d":128,"w":19,"x":"Write a 10-rule recycling guide for your building. Include four positive commands, three negative commands and three reasons."},{"d":129,"w":19,"x":"Write 120 words proposing five household energy/water changes. Give current problem, action, expected result and one measurable goal."},{"d":130,"w":19,"x":"Compare car, transit and bicycle in 140 words. Discuss cost, time, convenience and pollution, then recommend one option."},{"d":131,"w":19,"x":"Write a 120-word public weather notice: forecast, timing, risks, five instructions and where to find updates."},{"d":132,"w":19,"x":"Write a 150-word proposal to the city: define one local problem, propose two actions, explain three benefits and request a next step."},{"d":133,"w":19,"x":"Write a 160-word community newsletter article about an environmental initiative. Include issue, action, participation, benefits and call to action."},{"d":134,"w":20,"x":"Write a 170-word personal narrative with setting, trigger, response, complication, solution and reflection. Use both past tenses and eight connectors."},{"d":135,"w":20,"x":"Write a 10-step, 150-word process guide for a familiar task. Include prerequisites, warnings, verification and expected result."},{"d":136,"w":20,"x":"Write 160 words comparing two apps, routes or products against four criteria. Recommend one and address one drawback."},{"d":137,"w":20,"x":"Write a 170-word problem-solution memo with cause, two effects, three options, recommendation, implementation and evaluation."},{"d":138,"w":20,"x":"Prepare four speaking cards: personal experience, comparison, advice and opinion. For each, write only keywords plus six connectors—not a full script."},{"d":139,"w":20,"x":"Write 180 words: describe a community problem, recount a related experience, propose solutions and conclude. Plan 5 min, draft 20, check 10, rewrite weak sentences 10."},{"d":140,"w":20,"x":"Timed 180-word task: reply to a complaint, explain what happened, apologize, propose two solutions and state prevention steps. Perform a five-category self-check."},{"d":141,"w":21,"x":"Write 180 words on whether online learning is effective. Include a clear position, two reasons, two examples, one limitation and conclusion."},{"d":142,"w":21,"x":"Rewrite eight extreme statements more cautiously, then write a 120-word nuanced response using six degree/restriction expressions."},{"d":143,"w":21,"x":"Write three mini-paragraphs of 60 words each: claim, concrete example, explanation of relevance. Use a different example connector each time."},{"d":144,"w":21,"x":"Write a 14-line discussion where you concede two points but maintain your position. Include evidence and a respectful conclusion."},{"d":145,"w":21,"x":"Write a 170-word comparison of two invented viewpoints: shared concern, two differences, strongest argument and possible compromise."},{"d":146,"w":21,"x":"Prepare a debate card on remote work: position, three arguments, two examples, anticipated objection, rebuttal and closing. Use keywords, not a script."},{"d":147,"w":21,"x":"Write a timed 190-word opinion text with introduction, two argument paragraphs, counterpoint and conclusion. Perform a connector/tense check."},{"d":148,"w":22,"x":"Write a 170-word professional profile: role, experience, responsibilities, collaborators, tools, current project and goal."},{"d":149,"w":22,"x":"Write a 16-line meeting dialogue with agenda, update, disagreement, decision, three action items, owners and deadlines."},{"d":150,"w":22,"x":"Create a five-task priority table, then write 140 words justifying order, delegation, postponement and risk."},{"d":151,"w":22,"x":"Write a 180-word status update with accomplishments, current work, two blockers, impacts, mitigation, owner and next milestone."},{"d":152,"w":22,"x":"Write a 190-word recommendation memo comparing two options by cost, time, benefit and risk. Recommend one with implementation steps."},{"d":153,"w":22,"x":"Write a 150-word follow-up email after a meeting: recap decision, attach item, list actions/deadlines, ask confirmation and close professionally."},{"d":154,"w":22,"x":"Write meeting minutes in 180 words: attendees, purpose, key discussion, decisions, action-owner-deadline list and next meeting."},{"d":155,"w":23,"x":"Write a 130-word factual report with headline, lead, who/what/where/when, two details and attributed source. Separate facts from opinion."},{"d":156,"w":23,"x":"Read/watch the TV5 item and write an 80-100 word summary at roughly one-third length. Include main idea and three essential details, no opinion."},{"d":157,"w":23,"x":"Create six fact/opinion pairs on one topic. Label each, cite what evidence would verify facts, and soften uncertain claims."},{"d":158,"w":23,"x":"Write a 190-word cause-impact analysis of traffic, housing or education. Include two causes, three impacts, affected groups and one long-term implication."},{"d":159,"w":23,"x":"Using invented data for three categories across two years, write a 150-word description: overview, largest/smallest, two changes and one comparison. Do not explain causes."},{"d":160,"w":23,"x":"Write 170 words in two labeled parts: 70-word neutral summary and 100-word personal reaction with reasons and cautious prediction."},{"d":161,"w":23,"x":"Write a 200-word news analysis: summary, source assessment, fact/opinion examples, missing information and cautious conclusion."},{"d":162,"w":24,"x":"Write a 200-word three-day itinerary with transport, times, budget, two constraints, backup plan and time clauses."},{"d":163,"w":24,"x":"Write a 16-line airline-service dialogue: explain timeline, missed connection, needs, two alternatives, costs and agreed solution."},{"d":164,"w":24,"x":"Write a 170-word lost-item report: item description, last known place, earlier actions, discovery, report and contact request. Use two plus-que-parfait forms."},{"d":165,"w":24,"x":"Write a 200-word formal hotel complaint with booking facts, three failures, timeline, impact, prior contacts and exact resolution requested."},{"d":166,"w":24,"x":"Write a 190-word destination recommendation for a defined traveler. Cover attractions, timing, transport, food, budget, drawback and practical tip."},{"d":167,"w":24,"x":"Write a 220-word travel narrative with preparation, setting, problem, response, resolution and lesson. Use plus-que-parfait, imparfait and passé composé."},{"d":168,"w":24,"x":"Timed 200-word complaint-and-resolution account. Include chronology, evidence, request, outcome and evaluation of service."},{"d":169,"w":25,"x":"After the TV5 text, write a 120-word analytical summary identifying thesis, two arguments, example, counterpoint, purpose and tone."},{"d":170,"w":25,"x":"Listen twice only. Write 130 words reporting the speaker's position, three supports, one reservation and conclusion using reported-speech verbs."},{"d":171,"w":25,"x":"Prepare a one-page keyword map for: Faut-il limiter l'usage des voitures en ville ? Include position, three arguments, examples, counterpoint and conclusion."},{"d":172,"w":25,"x":"Write a negotiation plan for scheduling conflict: your needs, other person's needs, three options, concession, conditions and final agreement."},{"d":173,"w":25,"x":"Timed 200-word formal letter about repeated service failure: facts, chronology, impact, previous attempts, requested remedies, deadline and closing. Plan 5, write 25, check 10 minutes."},{"d":174,"w":25,"x":"Complete a 200-word integrated task: summarize a community proposal, state your view, compare options and recommend action. Use a 40-minute timer."},{"d":175,"w":25,"x":"Timed 200-220 word response: recount an experience, analyze a problem, compare two solutions and recommend one. Complete grammar, structure and task checklists."},{"d":176,"w":26,"x":"Write a 170-word introduction for: Faut-il rendre les transports publics gratuits ? Include context, question, thesis and a two-part plan."},{"d":177,"w":26,"x":"Write two 100-word argument paragraphs. Each must contain claim, invented data/example, explanation and link back to thesis."},{"d":178,"w":26,"x":"Write a 150-word counterargument paragraph: present the strongest objection fairly, concede one point, rebut with two reasons and return to your thesis."},{"d":179,"w":26,"x":"Revise a 180-word draft of your own: replace at least eight repetitions with pronouns or reference expressions and add five linking phrases."},{"d":180,"w":26,"x":"Write a 200-word persuasive memo: problem, two options, evaluation, recommendation, implementation and call to action."},{"d":181,"w":26,"x":"Edit yesterday's memo in four passes: task/structure, verbs, agreement/pronouns, vocabulary/punctuation. Rewrite at least five sentences and note why."},{"d":182,"w":26,"x":"Timed 220-word argumentative response with introduction, two arguments, counterargument/rebuttal and conclusion. Use a 45-minute timer."},{"d":183,"w":27,"x":"Write 12 discovery questions for an organization: goals, current process, users, pain points, constraints, timeline and success measures."},{"d":184,"w":27,"x":"Write a 180-word solution overview: audience, problem, three capabilities, benefit of each, integration and expected result. Avoid unexplained jargon."},{"d":185,"w":27,"x":"Using invented numbers, write a 170-word value case with baseline, projected change, assumptions, measurement period and non-financial benefit."},{"d":186,"w":27,"x":"Write a 14-line objection dialogue about cost or security: acknowledge, clarify, answer with evidence, propose risk reduction and confirm response."},{"d":187,"w":27,"x":"Write a 200-word pilot plan: objective, scope, users, timeline, responsibilities, three success criteria, risks and decision point."},{"d":188,"w":27,"x":"Write a 180-word client-meeting recap: goals, needs, proposal, objection, decisions, action-owner-deadline items and next meeting."},{"d":189,"w":27,"x":"Write a 220-word case summary from first conversation to agreed pilot. Include discovery, proposal, quantified value, objection and next steps."},{"d":190,"w":28,"x":"Write a 12-rule guide for a building or workplace: obligations, rights, prohibitions, two exceptions and effective date."},{"d":191,"w":28,"x":"Create a 160-word official notice with issuer, audience, change, reason, effective date, required action, contact and deadline."},{"d":192,"w":28,"x":"Write a 200-word formal complaint about an incorrect fee. Include account context, dated chronology, evidence, impact, remedy and response deadline."},{"d":193,"w":28,"x":"Write a 220-word reconsideration letter: identify decision, explain grounds, correct misunderstanding, list new evidence and request exact next action."},{"d":194,"w":28,"x":"Write a 200-word consultation submission: position, two concerns, affected groups, two modifications and balanced conclusion."},{"d":195,"w":28,"x":"Choose five formal rules and rewrite each in plain French with meaning, example and required action. Total 170-190 words."},{"d":196,"w":28,"x":"Timed 220-word institutional letter combining complaint and request for reconsideration. Use precise facts, evidence and requested remedy."},{"d":197,"w":29,"x":"Write a 180-word lifestyle audit: sleep, movement, food, stress and screen time. Describe patterns, effects and three priorities."},{"d":198,"w":29,"x":"Write a 160-word patient history: onset, duration, change, relevant history, medication, effect and questions for doctor."},{"d":199,"w":29,"x":"Write a 12-point after-visit care plan: medicine, timing, activity, monitoring, warning signs and follow-up. Include reasons for four instructions."},{"d":200,"w":29,"x":"Write a 190-word advice article for managing work-study stress: triggers, signs, five strategies, when to seek support and conclusion."},{"d":201,"w":29,"x":"Write a 170-word evaluation of an invented online health claim: source, evidence, uncertainty, risks and safe next step. Do not give a diagnosis."},{"d":202,"w":29,"x":"Create a four-week wellbeing plan in 200 words with three measurable goals, schedule, barriers, backup actions and weekly review."},{"d":203,"w":29,"x":"Timed 220-word response to a friend: acknowledge problem, analyze habits, recommend a plan, add safety boundaries and follow-up."},{"d":204,"w":30,"x":"Read two short TV5 texts/items and write a 180-word synthesis: shared topic, common points, differences, evidence and neutral conclusion."},{"d":205,"w":30,"x":"Listen twice. Create structured notes, then write a 150-word reconstruction with topic, three key points, examples and conclusion."},{"d":206,"w":30,"x":"Prepare a keyword-only outline for a six-minute presentation on a practical topic: hook, plan, three points, examples, summary and likely questions."},{"d":207,"w":30,"x":"Prepare negotiation notes for a budget/schedule conflict: positions, questions, three options, concession, conditions and confirmation."},{"d":208,"w":30,"x":"Timed 230-word response: Les entreprises devraient-elles imposer des jours au bureau ? Plan 7, write 30, check 8 minutes."},{"d":209,"w":30,"x":"Complete an integrated 230-word task based on reading/listening notes: summary, opinion, comparison and recommendation. Track time and errors."},{"d":210,"w":30,"x":"Timed 230-250 word task: analyze a workplace/community problem, compare three options, address an objection and recommend an implementation plan."},{"d":211,"w":31,"x":"Write a 230-word narrative with earlier preparation, background, trigger, response, complication, resolution and reflection. Use all three past tenses."},{"d":212,"w":31,"x":"Write a 14-line dialogue, then report it in 160-180 words without quotation marks. Use six reporting verbs and adjust pronouns/time."},{"d":213,"w":31,"x":"Write a 220-word suspense story. Control pacing with short event sentences, detailed background and six sequence expressions."},{"d":214,"w":31,"x":"Write a 200-word incident analysis: facts, direct/root causes, responsibilities, impacts, corrective action and lesson. Avoid emotional blame."},{"d":215,"w":31,"x":"Write a 200-word reflection on a decision: context, choice, result, two regrets, two alternatives, lesson and future behavior."},{"d":216,"w":31,"x":"Prepare a keyword map for a seven-minute personal story plus answers to six likely follow-up questions. Do not write a full script."},{"d":217,"w":31,"x":"Timed 250-word narrative with three past tenses, reported speech, regret and reflection. Check every verb against the timeline."},{"d":218,"w":32,"x":"Write a 220-word education/career timeline: stages, decisions, skills, projects, transitions and current relevance."},{"d":219,"w":32,"x":"Write a 190-word guide to effective language learning with six strategies, explanation of each and your own weekly measurement method. Use en + participle four times."},{"d":220,"w":32,"x":"Compare three invented courses in 220 words using five criteria and weights. Recommend one for your goals and address its drawback."},{"d":221,"w":32,"x":"Write three STAR-style skill examples, 90 words each: situation, task, action and measurable result. Use different action verbs."},{"d":222,"w":32,"x":"Write a 220-word three-horizon career plan with goals, required skills, actions, risks and measures of progress."},{"d":223,"w":32,"x":"Prepare five 90-second interview answers: introduction, strength, challenge, teamwork and motivation. Use keyword cards plus evidence."},{"d":224,"w":32,"x":"Write a 250-word motivation letter for an advanced course: background, motivation, evidence, fit, goals and contribution."},{"d":225,"w":33,"x":"Explain an AI tool in 220 words to a nontechnical reader: purpose, input, process, output, analogy, example and limitation."},{"d":226,"w":33,"x":"Write a balanced 240-word evaluation of an AI assistant: three benefits, three limitations, affected users, safeguards and conclusion."},{"d":227,"w":33,"x":"Write a 220-word plain-language privacy notice: data collected, purpose, retention, sharing, security and user rights."},{"d":228,"w":33,"x":"Write a 230-word risk analysis: source of bias, affected groups, consequences, testing, monitoring and accountability."},{"d":229,"w":33,"x":"Create a 10-step verification checklist, then apply it in 150 words to an invented viral claim. State confidence and missing evidence."},{"d":230,"w":33,"x":"Write a 250-word responsible-AI proposal with five rules, rationale, owners, monitoring, exceptions and review date."},{"d":231,"w":33,"x":"Timed 250-word opinion: Faut-il limiter l'utilisation de l'IA au travail ? Give benefits, risks, counterargument and policy recommendation."},{"d":232,"w":34,"x":"Write a 230-word problem definition: scope, trend, direct/root causes, affected groups, current response and why action is needed."},{"d":233,"w":34,"x":"Create a four-stakeholder table, then write a 200-word synthesis of interests, agreements, conflicts and leverage."},{"d":234,"w":34,"x":"Compare three policy options in 250 words against five criteria. Include likely outcome, unintended effect and ranking."},{"d":235,"w":34,"x":"Write a 220-word trade-off analysis of your top option: winners, costs, fairness, risks and mitigation. End with conditions for acceptance."},{"d":236,"w":34,"x":"Write a 250-word implementation plan: phases, timeline, owners, resources, communications, three indicators and review point."},{"d":237,"w":34,"x":"Prepare a seven-minute public presentation plus eight likely audience questions and concise answers. Use keywords, figures and transitions."},{"d":238,"w":34,"x":"Timed 260-word policy brief with problem, evidence, stakeholders, options, recommendation, implementation and evaluation."},{"d":239,"w":35,"x":"Use three short TV5 items/texts and write a 230-word neutral synthesis organized by themes, agreements, differences and evidence."},{"d":240,"w":35,"x":"Listen twice. Make two columns: explicit facts and inferences. Then write 170 words explaining four inferences and evidence for each."},{"d":241,"w":35,"x":"Prepare keyword notes for a seven-minute argument on technology in education: thesis, three arguments, examples, objection/rebuttal and conclusion."},{"d":242,"w":35,"x":"Create 12 challenging follow-up questions for yesterday's topic. Practise answering each for 30-45 seconds using repair and qualification phrases."},{"d":243,"w":35,"x":"Timed 280-word response: 100-word neutral synthesis of two sources plus 180-word opinion with comparison, counterpoint and recommendation. Allow 50 minutes."},{"d":244,"w":35,"x":"Complete a 280-word integrated task based on reading/listening notes, followed by a five-minute oral summary and questions."},{"d":245,"w":35,"x":"Timed 280-300 word task: synthesize a debate, compare positions, defend your view, rebut an objection and propose implementation."},{"d":246,"w":36,"x":"Listen twice. Produce a 180-word structural outline: purpose, sections, transitions, evidence, counterpoint and conclusion. Do not transcribe."},{"d":247,"w":36,"x":"After two listens, create two columns: 10 essential details and 5 distractors. Explain in one sentence why each distractor is secondary."},{"d":248,"w":36,"x":"Listen twice and write 160 words identifying attitude, five linguistic/audio clues, any change of tone and your confidence level."},{"d":249,"w":36,"x":"Record six inferences from one clip. For each, write exact clue, cautious inference and one alternative interpretation."},{"d":250,"w":36,"x":"After two listens, record every number with unit, comparison, time period and condition. Write a 150-word accurate data summary."},{"d":251,"w":36,"x":"Create a personal 20-symbol abbreviation key. Listen to a 4-6 minute clip and produce one-page notes, then reconstruct 180 words without replaying."},{"d":252,"w":36,"x":"Complete a two-listen test. Write a 200-word diagnostic: score, error categories, examples, cause and three next strategies."},{"d":253,"w":37,"x":"Prepare 15 questions for an unfamiliar service: basics, conditions, costs, exceptions, cancellation and confirmation. Practise without reading full sentences."},{"d":254,"w":37,"x":"Write only a persuasion card: hook, listener need, three benefits, proof/example and direct invitation. Then practise a two-minute opening."},{"d":255,"w":37,"x":"Create six common objections to an activity and two clarifying questions for each. Practise listening before answering."},{"d":256,"w":37,"x":"Write responses to eight objections using five steps: acknowledge, reframe, evidence, alternative and check-back question."},{"d":257,"w":37,"x":"Prepare a 10-minute persuasion role-play about joining a course, trip or activity. Plan six benefits, eight objections, alternatives and closing commitment."},{"d":258,"w":37,"x":"Mark rhythm groups in a 180-word speaking text. Shadow it three times, record once, then list five pronunciation/fluency corrections."},{"d":259,"w":37,"x":"Run two timed speaking tasks: 5-minute information interview and 10-minute persuasion. Record scores and three exact corrections per task."},{"d":260,"w":38,"x":"Analyze six sample prompts. For each, record audience, purpose, register, required points, tense and 5-minute outline. Do not draft yet."},{"d":261,"w":38,"x":"Timed 250-word complaint: context, evidence, chronology, impact, prior attempts, two remedies, deadline and formal closing. Plan 7/write 30/check 8."},{"d":262,"w":38,"x":"Continue this opening in 250 words: En ouvrant la porte, j'ai compris que quelque chose avait changé... Include clue, complication, decision, resolution and ending."},{"d":263,"w":38,"x":"Timed 280-word opinion: Les cours en ligne peuvent-ils remplacer les cours en personne ? Use introduction, two arguments/examples, counterargument/rebuttal and recommendation."},{"d":264,"w":38,"x":"Timed 300-word response: 110-word synthesis of two items plus 190-word opinion. Attribute ideas, compare sources, justify position and propose action."},{"d":265,"w":38,"x":"Take a previous 280-word draft. Edit it in exactly 10 minutes using the priority checklist; record every change category and final word count."},{"d":266,"w":38,"x":"Complete two timed tasks: one 250-word formal message and one 280-word argument. Score task achievement, organization, range and accuracy."},{"d":267,"w":39,"x":"Skim five B2 texts for 90 seconds each. Record type, audience, purpose, structure and one-sentence gist before detailed reading."},{"d":268,"w":39,"x":"Answer 15 detail questions across three texts. Underline clue, synonym and confirming context; limit yourself to 90 seconds per question."},{"d":269,"w":39,"x":"Take one article and label 20 connectors by function. Then write a 170-word map of its reasoning from premise to conclusion."},{"d":270,"w":39,"x":"Infer 15 unfamiliar words from context. Record sentence, clues, guessed meaning, dictionary meaning and useful collocation; create Anki only for 8 useful items."},{"d":271,"w":39,"x":"Write a 200-word stance analysis of one article: thesis, loaded terms, selected evidence, omissions, intended effect and reliability."},{"d":272,"w":39,"x":"Complete a timed 30-question reading set. Record answer, evidence line, confidence, time and error cause for every wrong answer."},{"d":273,"w":39,"x":"Write a 200-word reading diagnostic: scores by question type, time bottlenecks, three trap patterns and four corrective actions."},{"d":274,"w":40,"x":"Complete a timed listening set and a 220-word error report with score by type, exact examples and three drills for Week 41."},{"d":275,"w":40,"x":"Complete a timed reading set and produce a table of every error: type, evidence, why your choice failed and new rule."},{"d":276,"w":40,"x":"Record a full speaking mock. Transcribe five minutes, mark errors and natural alternatives, then score six criteria with evidence."},{"d":277,"w":40,"x":"Complete two timed tasks. Build an error inventory with counts by category, rewrite ten weak sentences and set three measurable Week 41 targets."},{"d":278,"w":40,"x":"Create and execute a 90-minute repair circuit for the top two weaknesses: explanation, controlled drill, speaking/writing transfer and mini-retest."},{"d":279,"w":40,"x":"Complete listening, reading, one speaking and one writing task in a single controlled session. Record raw results without changing answers afterward."},{"d":280,"w":40,"x":"Write a 250-word Week 40 report: scores in four skills, strongest evidence, top five gaps, root causes and ranked plan for Weeks 41-43."},{"d":281,"w":41,"x":"Select a 60-90 second difficult extract. Transcribe it, compare with transcript, classify every mismatch, then write a corrected 120-word reconstruction."},{"d":282,"w":41,"x":"After two listens, record five inferences with two clues each and one alternative explanation. Finish with a 150-word attitude summary."},{"d":283,"w":41,"x":"Annotate one text: box 15 connectors, draw arrows from 12 pronouns to referents, and write a 170-word reasoning map."},{"d":284,"w":41,"x":"Complete 20 questions under a reduced time limit. Record seconds per question, evidence and whether the new strategy saved time."},{"d":285,"w":41,"x":"Record three 3-minute answers. Mark every pause over three seconds, replace it with a repair phrase, and repeat each answer once without a script."},{"d":286,"w":41,"x":"Take 20 errors from previous texts. Write the rule, corrected sentence and a new original example for each. Then write a 150-word paragraph using the target structures."},{"d":287,"w":41,"x":"Complete a compact four-skill retest. Write a 220-word comparison with scores, error-rate change, remaining gap and Week 42 mock strategy."},{"d":288,"w":42,"x":"Complete the full official-style listening section without pausing. Afterward, log score, error type, evidence and correction for every miss."},{"d":289,"w":42,"x":"Complete a full timed reading section. Create an error table with question type, your reasoning, textual evidence, trap and improved strategy."},{"d":290,"w":42,"x":"Record a complete speaking mock: information task plus persuasion task. Do not restart. Score task completion, interaction, fluency, range, accuracy and pronunciation."},{"d":291,"w":42,"x":"Complete the full official-style writing section under its real time limit. Do not use correction tools. Score and rewrite only after completion."},{"d":292,"w":42,"x":"Write a 300-word four-skill analysis with scores, patterns, root causes, highest-impact fixes and exact Mock 2 targets."},{"d":293,"w":42,"x":"Complete all available sections in one day/session sequence. Record raw answers, timings, fatigue and confidence before checking."},{"d":294,"w":42,"x":"Create a Mock 1 versus Mock 2 comparison table and a 250-word decision memo selecting only two technical priorities plus one confidence routine."},{"d":295,"w":43,"x":"Complete one 25-minute listening tune-up and review only wrong answers. Write three final reminders on one card."},{"d":296,"w":43,"x":"Complete one 25-minute reading tune-up. Review only misses and write three final pacing rules on the same strategy card."},{"d":297,"w":43,"x":"Record one shortened speaking pair. Stop after one attempt, note two strengths and only two corrections; repeat corrected sentences, not the whole mock."},{"d":298,"w":43,"x":"Outline two prompts in 7 minutes each, then write only one 180-word response. Perform the final checklist and stop."},{"d":299,"w":43,"x":"Create one final page: logistics checklist, section timing, three strategies per skill, pause/breathing routine and emergency fallback. Do not add new study content."},{"d":300,"w":43,"x":"Write a brief 100-word confidence note: three improvements, two dependable strategies and one calm intention for test day. Finish studying early."},{"d":301,"w":43,"x":"Write a 250-word final reflection: starting point, milestones, four-skill evidence, challenges overcome, exam intention and post-exam continuation plan."}];
const WRITING_TOTAL = WRITING_DAYS.length;

const TV5_DAYS = [{"d":1,"w":1,"l":"Première classe","x":"Première classe: Les salutations / Se présenter"},{"d":2,"w":1,"l":"Première classe","x":"Première classe: Donner des informations personnelles"},{"d":3,"w":1,"l":"Première classe","x":"Première classe: Les objets du quotidien"},{"d":4,"w":1,"l":"Première classe","x":"Première classe: Parler de soi / Les professions"},{"d":5,"w":1,"l":"Première classe","x":"Première classe: Les pays et les nationalités"},{"d":6,"w":1,"l":"Première classe","x":"Première classe: Poser des questions"},{"d":7,"w":1,"l":null,"x":"Replay one Week 1 video without transcript, then with transcript"},{"d":8,"w":2,"l":"Première classe","x":"Première classe: La famille"},{"d":9,"w":2,"l":"Première classe","x":"Première classe: Présenter sa famille"},{"d":10,"w":2,"l":"Première classe","x":"Première classe: Le portrait physique"},{"d":11,"w":2,"l":"Première classe","x":"Première classe: Les vêtements"},{"d":12,"w":2,"l":"Première classe","x":"Première classe: Le logement"},{"d":13,"w":2,"l":"Première classe","x":"Première classe: Les nombres / Donner ses coordonnées"},{"d":14,"w":2,"l":null,"x":"Replay La famille or Le logement; shadow five lines"},{"d":15,"w":3,"l":"Première classe","x":"Première classe: L'heure et les horaires"},{"d":16,"w":3,"l":"Première classe","x":"Première classe: Les loisirs"},{"d":17,"w":3,"l":"Première classe","x":"Première classe: Une journée"},{"d":18,"w":3,"l":"Première classe","x":"Première classe: Les activités quotidiennes"},{"d":19,"w":3,"l":"Première classe","x":"Première classe: Les goûts et les loisirs"},{"d":20,"w":3,"l":"Première classe","x":"Première classe: Poser des questions"},{"d":21,"w":3,"l":null,"x":"Replay Une journée; shadow five sentences"},{"d":22,"w":4,"l":"Première classe","x":"Première classe: Au marché / Les aliments"},{"d":23,"w":4,"l":"Première classe","x":"Première classe: Au café"},{"d":24,"w":4,"l":"Première classe","x":"Première classe: Faire les courses"},{"d":25,"w":4,"l":"Première classe","x":"Première classe: Les repas"},{"d":26,"w":4,"l":"Première classe","x":"Première classe: Le petit déjeuner"},{"d":27,"w":4,"l":"Première classe","x":"Première classe: Au restaurant"},{"d":28,"w":4,"l":null,"x":"Replay Au café/Au marché without transcript; summarize in English then simple French"},{"d":29,"w":5,"l":"Première classe","x":"Première classe: Les transports"},{"d":30,"w":5,"l":"Première classe","x":"Première classe: Demander son chemin"},{"d":31,"w":5,"l":"Première classe","x":"Première classe: Parler de ses projets"},{"d":32,"w":5,"l":"Première classe","x":"Première classe: La météo"},{"d":33,"w":5,"l":"Première classe","x":"Première classe: Proposer une sortie"},{"d":34,"w":5,"l":null,"x":"Choose one unseen Première classe A1 activity; use four-pass method"},{"d":35,"w":5,"l":null,"x":"One familiar replay plus one unseen A1 clip; note gist and five words"},{"d":36,"w":6,"l":"A1","x":"A1: Le corps humain"},{"d":37,"w":6,"l":"A1","x":"A1: Chez le médecin"},{"d":38,"w":6,"l":"A1","x":"A1: À la pharmacie"},{"d":39,"w":6,"l":"A1","x":"A1: Conseils de santé"},{"d":40,"w":6,"l":"A1","x":"A1: Prendre rendez-vous"},{"d":41,"w":6,"l":"A1","x":"A1: Bien-être et habitudes"},{"d":42,"w":6,"l":null,"x":"Replay Chez le médecin; shadow six lines"},{"d":43,"w":7,"l":"A1","x":"A1: En ville"},{"d":44,"w":7,"l":"A1","x":"A1: Prendre les transports"},{"d":45,"w":7,"l":"A1","x":"A1: À la poste"},{"d":46,"w":7,"l":"A1","x":"A1: À la banque"},{"d":47,"w":7,"l":"A1-A2","x":"A1-A2: Comparer des lieux"},{"d":48,"w":7,"l":"A1","x":"A1: À l'office de tourisme"},{"d":49,"w":7,"l":null,"x":"Unseen A1 city/service clip; note gist and five details"},{"d":50,"w":8,"l":"A1-A2","x":"A1-A2: Hier, j'ai..."},{"d":51,"w":8,"l":"A1-A2","x":"A1-A2: Activités passées"},{"d":52,"w":8,"l":"A1-A2","x":"A1-A2: Ce que je n'ai pas fait"},{"d":53,"w":8,"l":"A1-A2","x":"A1-A2: Raconter son week-end"},{"d":54,"w":8,"l":"A1-A2","x":"A1-A2: Une journée passée"},{"d":55,"w":8,"l":"A1-A2","x":"A1-A2: Un week-end en famille"},{"d":56,"w":8,"l":null,"x":"Replay one past-event clip; shadow and retell"},{"d":57,"w":9,"l":"A1-A2","x":"A1-A2: Préparer un voyage"},{"d":58,"w":9,"l":"A1-A2","x":"A1-A2: Réserver une chambre"},{"d":59,"w":9,"l":"A1-A2","x":"A1-A2: Un problème à l'hôtel"},{"d":60,"w":9,"l":"A1-A2","x":"A1-A2: À la gare"},{"d":61,"w":9,"l":"A1-A2","x":"A1-A2: Un voyage passé"},{"d":62,"w":9,"l":"A1-A2","x":"A1-A2: Raconter un voyage"},{"d":63,"w":9,"l":null,"x":"Unseen travel clip; identify plan, problem and outcome"},{"d":64,"w":10,"l":"A1-A2","x":"A1-A2: Le monde du travail"},{"d":65,"w":10,"l":"A1-A2","x":"A1-A2: Parler de ses compétences"},{"d":66,"w":10,"l":"A1-A2","x":"A1-A2: Les règles au travail"},{"d":67,"w":10,"l":"A1-A2","x":"A1-A2: Présenter l'avancement"},{"d":68,"w":10,"l":"A1-A2","x":"A1-A2: Écrire un message"},{"d":69,"w":10,"l":"A1-A2","x":"A1-A2: Apprendre une langue"},{"d":70,"w":10,"l":null,"x":"One unseen A1-A2 clip; record gist plus eight details"},{"d":71,"w":11,"l":"A2","x":"A2: Dans un magasin de vêtements"},{"d":72,"w":11,"l":"A2","x":"A2: Décrire un objet"},{"d":73,"w":11,"l":"A2","x":"A2: Choisir un produit"},{"d":74,"w":11,"l":"A2","x":"A2: Acheter et remplacer un article"},{"d":75,"w":11,"l":"A2","x":"A2: Retourner un achat"},{"d":76,"w":11,"l":"A2","x":"A2: Acheter sur Internet"},{"d":77,"w":11,"l":null,"x":"Unseen shopping clip; identify product, price, problem and decision"},{"d":78,"w":12,"l":"A2","x":"A2: Chercher un logement"},{"d":79,"w":12,"l":"A2","x":"A2: Une annonce immobilière"},{"d":80,"w":12,"l":"A2","x":"A2: Visiter un appartement"},{"d":81,"w":12,"l":"A2","x":"A2: Déménager"},{"d":82,"w":12,"l":"A2","x":"A2: Signaler un problème"},{"d":83,"w":12,"l":"A2","x":"A2: Parler avec ses voisins"},{"d":84,"w":12,"l":null,"x":"Unseen housing clip; record price, location, features and issue"},{"d":85,"w":13,"l":"A2","x":"A2: Projets pour l'avenir"},{"d":86,"w":13,"l":"A2","x":"A2: Prévisions personnelles"},{"d":87,"w":13,"l":"A2","x":"A2: Inviter quelqu'un"},{"d":88,"w":13,"l":"A2","x":"A2: Reporter un rendez-vous"},{"d":89,"w":13,"l":"A2","x":"A2: Organiser selon la situation"},{"d":90,"w":13,"l":"A2","x":"A2: Organiser une activité"},{"d":91,"w":13,"l":null,"x":"Unseen plans/invitation clip; capture changes and final arrangement"},{"d":92,"w":14,"l":"A2","x":"A2: Les outils numériques"},{"d":93,"w":14,"l":"A2","x":"A2: Demander de l'aide technique"},{"d":94,"w":14,"l":"A2","x":"A2: Suivre un tutoriel"},{"d":95,"w":14,"l":"A2","x":"A2: Comprendre une information"},{"d":96,"w":14,"l":"A2","x":"A2: Les habitudes médiatiques"},{"d":97,"w":14,"l":"A2","x":"A2: Laisser un message"},{"d":98,"w":14,"l":null,"x":"Unseen technology/media clip; summarize issue and solution"},{"d":99,"w":15,"l":"A2","x":"A2: Donner son opinion"},{"d":100,"w":15,"l":"A2","x":"A2: Être d'accord ou pas"},{"d":101,"w":15,"l":"A2","x":"A2: Expliquer ses raisons"},{"d":102,"w":15,"l":"A2","x":"A2: Avantages et inconvénients"},{"d":103,"w":15,"l":"A2","x":"A2: Justifier un choix"},{"d":104,"w":15,"l":null,"x":"One unseen A2 clip; note gist, eight details and speaker opinion"},{"d":105,"w":15,"l":null,"x":"Unseen A2 clip twice only; record gist and ten verifiable details"},{"d":106,"w":16,"l":"A2","x":"A2: Quand j'étais enfant"},{"d":107,"w":16,"l":"A2","x":"A2: Avant et maintenant"},{"d":108,"w":16,"l":"A2","x":"A2: Décrire un souvenir"},{"d":109,"w":16,"l":"A2","x":"A2: Un événement inattendu"},{"d":110,"w":16,"l":"A2","x":"A2: Une petite aventure"},{"d":111,"w":16,"l":"A2","x":"A2: Les souvenirs d'enfance"},{"d":112,"w":16,"l":null,"x":"Unseen A2 past-story clip; note setting, event, reaction and ending"},{"d":113,"w":17,"l":"A2","x":"A2: Remplir un formulaire"},{"d":114,"w":17,"l":"A2","x":"A2: Délais et rendez-vous"},{"d":115,"w":17,"l":"A2","x":"A2: Contacter un service public"},{"d":116,"w":17,"l":"A2","x":"A2: Expliquer une situation"},{"d":117,"w":17,"l":"A2","x":"A2: Suivre une procédure"},{"d":118,"w":17,"l":"A2","x":"A2: Suivre une demande"},{"d":119,"w":17,"l":null,"x":"Unseen service-call clip; record request, documents, deadline and result"},{"d":120,"w":18,"l":"A2","x":"A2: Décrire une personne"},{"d":121,"w":18,"l":"A2","x":"A2: Exprimer ses émotions"},{"d":122,"w":18,"l":"A2","x":"A2: Conseiller un ami"},{"d":123,"w":18,"l":"A2","x":"A2: Présenter ses excuses"},{"d":124,"w":18,"l":"A2","x":"A2: Organiser un repas"},{"d":125,"w":18,"l":"A2","x":"A2: Gérer un désaccord"},{"d":126,"w":18,"l":null,"x":"Unseen social-problem clip; note feelings, viewpoints and resolution"},{"d":127,"w":19,"l":"A2","x":"A2: Mon quartier"},{"d":128,"w":19,"l":"A2","x":"A2: Recycler"},{"d":129,"w":19,"l":"A2","x":"A2: Économiser l'énergie"},{"d":130,"w":19,"l":"A2","x":"A2: Se déplacer autrement"},{"d":131,"w":19,"l":"A2","x":"A2: Un événement météorologique"},{"d":132,"w":19,"l":"A2-B1","x":"A2-B1: Améliorer son quartier"},{"d":133,"w":19,"l":null,"x":"Unseen community/environment clip; note problem, causes, proposal and reaction"},{"d":134,"w":20,"l":"A2-B1","x":"A2-B1: Raconter une expérience"},{"d":135,"w":20,"l":"A2-B1","x":"A2-B1: Expliquer une démarche"},{"d":136,"w":20,"l":"A2-B1","x":"A2-B1: Faire un choix"},{"d":137,"w":20,"l":"A2-B1","x":"A2-B1: Proposer une solution"},{"d":138,"w":20,"l":"A2-B1","x":"A2-B1: Parler en continu"},{"d":139,"w":20,"l":"A2-B1","x":"A2-B1: Écrire un texte organisé"},{"d":140,"w":20,"l":null,"x":"Unseen A2/B1-bridge audio; capture gist, viewpoints and 10 details"},{"d":141,"w":21,"l":"B1","x":"B1: Donner son avis"},{"d":142,"w":21,"l":"B1","x":"B1: Nuancer ses propos"},{"d":143,"w":21,"l":"B1","x":"B1: Donner des exemples"},{"d":144,"w":21,"l":"B1","x":"B1: Réagir dans une discussion"},{"d":145,"w":21,"l":"B1","x":"B1: Deux points de vue"},{"d":146,"w":21,"l":"B1","x":"B1: Participer à un débat"},{"d":147,"w":21,"l":null,"x":"Unseen B1 opinion clip; note thesis, reasons, examples and reservation"},{"d":148,"w":22,"l":"B1","x":"B1: Présenter son travail"},{"d":149,"w":22,"l":"B1","x":"B1: Participer à une réunion"},{"d":150,"w":22,"l":"B1","x":"B1: Gérer ses priorités"},{"d":151,"w":22,"l":"B1","x":"B1: Donner une mise à jour"},{"d":152,"w":22,"l":"B1","x":"B1: Proposer une solution"},{"d":153,"w":22,"l":"B1","x":"B1: Écrire au travail"},{"d":154,"w":22,"l":null,"x":"Unseen workplace clip; capture purpose, issue, decision and actions"},{"d":155,"w":23,"l":"B1","x":"B1: Comprendre un article"},{"d":156,"w":23,"l":"B1","x":"B1: Résumer une information"},{"d":157,"w":23,"l":"B1","x":"B1: Vérifier une information"},{"d":158,"w":23,"l":"B1","x":"B1: Expliquer un phénomène"},{"d":159,"w":23,"l":"B1","x":"B1: Présenter des résultats"},{"d":160,"w":23,"l":"B1","x":"B1: Commenter une information"},{"d":161,"w":23,"l":null,"x":"Unseen B1 news clip; note 5W facts, source, cause and impact"},{"d":162,"w":24,"l":"B1","x":"B1: Organiser un voyage"},{"d":163,"w":24,"l":"B1","x":"B1: Un transport annulé"},{"d":164,"w":24,"l":"B1","x":"B1: Un objet perdu"},{"d":165,"w":24,"l":"B1","x":"B1: Se plaindre à l'hôtel"},{"d":166,"w":24,"l":"B1","x":"B1: Conseiller une destination"},{"d":167,"w":24,"l":"B1","x":"B1: Raconter un voyage marquant"},{"d":168,"w":24,"l":null,"x":"Unseen B1 travel disruption clip; capture chronology, options and resolution"},{"d":169,"w":25,"l":"B1","x":"B1: Comprendre un texte argumentatif"},{"d":170,"w":25,"l":"B1","x":"B1: Comprendre une interview"},{"d":171,"w":25,"l":"B1","x":"B1: Parler en continu"},{"d":172,"w":25,"l":"B1","x":"B1: Trouver une solution ensemble"},{"d":173,"w":25,"l":"B1","x":"B1: Écrire une lettre formelle"},{"d":174,"w":25,"l":null,"x":"One B1 reading plus one B1 listening activity"},{"d":175,"w":25,"l":null,"x":"Unseen B1 audio under exam-like two-listen conditions"},{"d":176,"w":26,"l":"B1","x":"B1: Construire un argument"},{"d":177,"w":26,"l":"B1","x":"B1: Justifier avec des preuves"},{"d":178,"w":26,"l":"B1","x":"B1: Répondre à une objection"},{"d":179,"w":26,"l":"B1","x":"B1: Rendre un texte fluide"},{"d":180,"w":26,"l":"B1","x":"B1: Convaincre"},{"d":181,"w":26,"l":"B1","x":"B1: Corriger son texte"},{"d":182,"w":26,"l":null,"x":"Unseen B1 debate clip; map claim, evidence, objection and conclusion"},{"d":183,"w":27,"l":"B1","x":"B1: Comprendre un besoin professionnel"},{"d":184,"w":27,"l":"B1","x":"B1: Présenter un service"},{"d":185,"w":27,"l":"B1","x":"B1: Parler de résultats"},{"d":186,"w":27,"l":"B1","x":"B1: Gérer une objection"},{"d":187,"w":27,"l":"B1","x":"B1: Planifier un projet"},{"d":188,"w":27,"l":"B1","x":"B1: Résumer une réunion client"},{"d":189,"w":27,"l":null,"x":"Unseen B1 business clip; capture need, value, objection and next step"},{"d":190,"w":28,"l":"B1","x":"B1: Comprendre un règlement"},{"d":191,"w":28,"l":"B1","x":"B1: Lire un avis public"},{"d":192,"w":28,"l":"B1","x":"B1: Contester un service"},{"d":193,"w":28,"l":"B1","x":"B1: Demander la révision d'une décision"},{"d":194,"w":28,"l":"B1","x":"B1: Participer à une consultation"},{"d":195,"w":28,"l":"B1","x":"B1: Informer quelqu'un"},{"d":196,"w":28,"l":null,"x":"Unseen B1 public-service clip; note rule, affected group, deadline and appeal"},{"d":197,"w":29,"l":"B1","x":"B1: Mode de vie"},{"d":198,"w":29,"l":"B1","x":"B1: Expliquer ses antécédents"},{"d":199,"w":29,"l":"B1","x":"B1: Suivre des recommandations"},{"d":200,"w":29,"l":"B1","x":"B1: Gérer le stress"},{"d":201,"w":29,"l":"B1","x":"B1: Vérifier un conseil"},{"d":202,"w":29,"l":"B1","x":"B1: Améliorer ses habitudes"},{"d":203,"w":29,"l":null,"x":"Unseen B1 health clip; note history, advice, warning and follow-up"},{"d":204,"w":30,"l":"B1","x":"B1: Comparer deux documents"},{"d":205,"w":30,"l":"B1","x":"B1: Comprendre un exposé"},{"d":206,"w":30,"l":"B1","x":"B1: Faire une présentation"},{"d":207,"w":30,"l":"B1","x":"B1: Résoudre un problème à deux"},{"d":208,"w":30,"l":"B1","x":"B1: Rédiger un texte argumentatif"},{"d":209,"w":30,"l":null,"x":"One unseen B1 listening plus one B1 reading"},{"d":210,"w":30,"l":null,"x":"Unseen B1 audio under strict two-listen conditions"},{"d":211,"w":31,"l":"B1","x":"B1: Raconter un événement complexe"},{"d":212,"w":31,"l":"B1","x":"B1: Rapporter une conversation"},{"d":213,"w":31,"l":"B1","x":"B1: Une situation inattendue"},{"d":214,"w":31,"l":"B1","x":"B1: Analyser ce qui s'est passé"},{"d":215,"w":31,"l":"B1-B2","x":"B1-B2: Regrets et leçons"},{"d":216,"w":31,"l":"B1-B2","x":"B1-B2: Raconter une expérience marquante"},{"d":217,"w":31,"l":null,"x":"Unseen B1+ narrative; note timeline, voices, causes and reflection"},{"d":218,"w":32,"l":"B1","x":"B1: Présenter son parcours"},{"d":219,"w":32,"l":"B1","x":"B1: Apprendre efficacement"},{"d":220,"w":32,"l":"B1","x":"B1: Choisir une formation"},{"d":221,"w":32,"l":"B1","x":"B1: Mettre en valeur ses compétences"},{"d":222,"w":32,"l":"B1","x":"B1: Parler de son avenir professionnel"},{"d":223,"w":32,"l":"B1-B2","x":"B1-B2: Réussir un entretien"},{"d":224,"w":32,"l":null,"x":"Unseen B1+ education/career clip; note path, decision and outcome"},{"d":225,"w":33,"l":"B1-B2","x":"B1-B2: Expliquer une technologie"},{"d":226,"w":33,"l":"B1-B2","x":"B1-B2: Avantages et risques du numérique"},{"d":227,"w":33,"l":"B1-B2","x":"B1-B2: Protéger sa vie privée"},{"d":228,"w":33,"l":"B1-B2","x":"B1-B2: Une technologie équitable"},{"d":229,"w":33,"l":"B1-B2","x":"B1-B2: Reconnaître une fausse information"},{"d":230,"w":33,"l":"B1-B2","x":"B1-B2: Encadrer l'usage de l'IA"},{"d":231,"w":33,"l":null,"x":"Unseen B1+ technology clip; note claim, evidence, risk and safeguard"},{"d":232,"w":34,"l":"B1-B2","x":"B1-B2: Comprendre un enjeu public"},{"d":233,"w":34,"l":"B1-B2","x":"B1-B2: Comprendre les acteurs"},{"d":234,"w":34,"l":"B1-B2","x":"B1-B2: Évaluer des solutions"},{"d":235,"w":34,"l":"B1-B2","x":"B1-B2: Examiner les compromis"},{"d":236,"w":34,"l":"B1-B2","x":"B1-B2: Passer de l'idée à l'action"},{"d":237,"w":34,"l":"B1-B2","x":"B1-B2: Présenter une proposition publique"},{"d":238,"w":34,"l":null,"x":"Unseen B1+ policy clip; map problem, stakeholders, options and trade-offs"},{"d":239,"w":35,"l":"B1-B2","x":"B1-B2: Synthétiser plusieurs documents"},{"d":240,"w":35,"l":"B1-B2","x":"B1-B2: Comprendre l'implicite"},{"d":241,"w":35,"l":"B1-B2","x":"B1-B2: Défendre un point de vue"},{"d":242,"w":35,"l":"B1-B2","x":"B1-B2: Réagir spontanément"},{"d":243,"w":35,"l":"B1-B2","x":"B1-B2: Réagir à un dossier"},{"d":244,"w":35,"l":null,"x":"One unseen B1+ listening and one reading; strict timing"},{"d":245,"w":35,"l":null,"x":"Unseen B1+/B2-bridge audio under strict conditions"},{"d":246,"w":36,"l":"B2","x":"B2: Comprendre un exposé structuré"},{"d":247,"w":36,"l":"B2","x":"B2: Repérer les informations importantes"},{"d":248,"w":36,"l":"B2","x":"B2: Identifier le ton"},{"d":249,"w":36,"l":"B2","x":"B2: Comprendre ce qui n'est pas dit"},{"d":250,"w":36,"l":"B2","x":"B2: Comprendre des données chiffrées"},{"d":251,"w":36,"l":"B2","x":"B2: Prendre des notes efficacement"},{"d":252,"w":36,"l":null,"x":"Unseen B2 clip under strict two-listen conditions"},{"d":253,"w":37,"l":"B2","x":"B2: Obtenir des renseignements"},{"d":254,"w":37,"l":"B2","x":"B2: Convaincre un ami"},{"d":255,"w":37,"l":"B2","x":"B2: Comprendre une hésitation"},{"d":256,"w":37,"l":"B2","x":"B2: Répondre et relancer"},{"d":257,"w":37,"l":"B2","x":"B2: Faire changer d'avis"},{"d":258,"w":37,"l":"B2","x":"B2: Parler avec fluidité"},{"d":259,"w":37,"l":null,"x":"One B2 model interaction; identify strategies, not memorized wording"},{"d":260,"w":38,"l":"B2","x":"B2: Comprendre une consigne d'écriture"},{"d":261,"w":38,"l":"B2","x":"B2: Écrire une réclamation"},{"d":262,"w":38,"l":"B2","x":"B2: Continuer une histoire"},{"d":263,"w":38,"l":"B2","x":"B2: Défendre une opinion à l'écrit"},{"d":264,"w":38,"l":"B2","x":"B2: Réagir à deux documents"},{"d":265,"w":38,"l":"B2","x":"B2: Améliorer une production écrite"},{"d":266,"w":38,"l":null,"x":"One official-style writing prompt plus one B2 model for structure comparison"},{"d":267,"w":39,"l":"B2","x":"B2: Comprendre rapidement un texte"},{"d":268,"w":39,"l":"B2","x":"B2: Trouver une information précise"},{"d":269,"w":39,"l":"B2","x":"B2: Suivre le raisonnement"},{"d":270,"w":39,"l":"B2","x":"B2: Comprendre un mot inconnu"},{"d":271,"w":39,"l":"B2","x":"B2: Analyser le point de vue"},{"d":272,"w":39,"l":null,"x":"Three varied B2 texts under a fixed time limit"},{"d":273,"w":39,"l":null,"x":"One unseen B2 dossier with mixed question types"},{"d":274,"w":40,"l":null,"x":"Official-style B2/NCLC 7 listening set"},{"d":275,"w":40,"l":null,"x":"Official-style B2/NCLC 7 reading set"},{"d":276,"w":40,"l":null,"x":"Official-style information and persuasion prompts"},{"d":277,"w":40,"l":null,"x":"Official-style formal and argumentative prompts"},{"d":278,"w":40,"l":null,"x":"Choose one targeted TV5 activity matching the weakest comprehension skill"},{"d":279,"w":40,"l":null,"x":"One timed listening and one timed reading set"},{"d":280,"w":40,"l":null,"x":"Replay only the hardest diagnostic extracts for analysis"},{"d":281,"w":41,"l":null,"x":"B2 listening: choose a clip matching the weakest sound/vocabulary category"},{"d":282,"w":41,"l":null,"x":"B2 listening: attitude and implicit meaning"},{"d":283,"w":41,"l":null,"x":"B2 reading: argumentative text with reference questions"},{"d":284,"w":41,"l":null,"x":"Timed B2 reading set targeting the slowest question type"},{"d":285,"w":41,"l":null,"x":"B2 oral model: observe pacing and repair strategies"},{"d":286,"w":41,"l":null,"x":"Read one B2 model only to observe correction patterns"},{"d":287,"w":41,"l":null,"x":"One unseen B2 listening and one reading set focused on repaired weaknesses"},{"d":288,"w":42,"l":null,"x":"Official TEF Canada or TCF Canada listening sample for your chosen exam"},{"d":289,"w":42,"l":null,"x":"Official TEF Canada or TCF Canada reading sample for your chosen exam"},{"d":290,"w":42,"l":null,"x":"Official-style information and persuasion prompts for the chosen exam"},{"d":291,"w":42,"l":null,"x":"Official-style writing prompts for the chosen exam"},{"d":292,"w":42,"l":null,"x":"Replay/open only the items needed to verify errors"},{"d":293,"w":42,"l":null,"x":"A second official-style TEF Canada or TCF Canada set"},{"d":294,"w":42,"l":null,"x":"Review the most diagnostic items, not every correct answer"},{"d":295,"w":43,"l":null,"x":"One short B2 listening set at moderate difficulty"},{"d":296,"w":43,"l":null,"x":"One short B2 reading set at moderate difficulty"},{"d":297,"w":43,"l":null,"x":"One information prompt and one short persuasion prompt"},{"d":298,"w":43,"l":null,"x":"One short planning drill using an official-style prompt"},{"d":299,"w":43,"l":null,"x":"No new TV5 task; optional relaxed French listening only"},{"d":300,"w":43,"l":null,"x":"Optional enjoyable French content without exercises"},{"d":301,"w":43,"l":null,"x":"No test practice today unless the real exam is scheduled later"}];
const TV5_TOTAL = TV5_DAYS.length;




const GRAMMAR_FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

function buildGoogleSearchUrl(lessonText) {
  const q = "site:french.kwiziq.com " + lessonText;
  return "https://www.google.com/search?q=" + encodeURIComponent(q);
}

function splitLessonChips(text) {
  return text
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const KWIZIQ_FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

function extractWordTarget(text) {
  const m = text.match(/(\d+)[\s-]*words?\b/i);
  return m ? parseInt(m[1], 10) : null;
}

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

const WRITING_FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

function WritingModule({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(WRITING_FRESH_PROGRESS);
  const [entries, setEntries] = useState({});
  const [storageOk, setStorageOk] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [feedbackState, setFeedbackState] = useState("idle"); // idle | loading | error
  const saveTimer = useRef(null);
  const entriesRef = useRef({});

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      let ent = {};
      const present = await waitForStorage(10, 300);
      if (present) {
        try {
          const r = await window.storage.get("writing-progress", false);
          if (r && r.value) p = JSON.parse(r.value);
        } catch (e) {}
        try {
          const r = await window.storage.get("writing-entries", false);
          if (r && r.value) ent = JSON.parse(r.value);
        } catch (e) {}
      }
      const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || WRITING_FRESH_PROGRESS;
      setProgress(finalProgress);
      setEntries(ent);
      setStorageOk(diag.ok);
      const initialDay = startDay
        ? Math.max(1, Math.min(startDay, WRITING_TOTAL))
        : Math.min(finalProgress.current_day, WRITING_TOTAL);
      setViewDay(initialDay);
      setDraft((ent[initialDay] && ent[initialDay].text) || "");
      setPhase("day");
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      }
    } catch (e) {
      setStorageOk(false);
    }
  }

  const viewIdx = viewDay - 1;
  const viewed = viewIdx >= 0 && viewIdx < WRITING_TOTAL ? WRITING_DAYS[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= WRITING_TOTAL;
  const wordTarget = viewed ? extractWordTarget(viewed.x) : null;
  const wordCount = countWords(draft);
  const currentFeedback = entries[viewDay] && entries[viewDay].feedback;

  function switchToDay(day) {
    // flush any pending debounced save for the day we're leaving first
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      persist("writing-entries", entriesRef.current);
    }
    setViewDay(day);
    setDraft((entriesRef.current[day] && entriesRef.current[day].text) || "");
    setSaveState("idle");
    setFeedbackState("idle");
  }

  function goPrevPage() {
    if (viewDay > 1) switchToDay(viewDay - 1);
  }

  function goNextPage() {
    if (viewDay < WRITING_TOTAL) switchToDay(viewDay + 1);
  }

  function handleDraftChange(text) {
    setDraft(text);
    setSaveState("saving");
    const next = { ...entriesRef.current, [viewDay]: { ...(entriesRef.current[viewDay] || {}), text } };
    entriesRef.current = next;
    setEntries(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await persist("writing-entries", entriesRef.current);
      setSaveState("saved");
    }, 1000);
  }

  async function getFeedback() {
    if (!draft.trim()) return;
    setFeedbackState("loading");
    try {
      const prompt =
        "You are a supportive French tutor helping a CLB7/NCLC7 exam candidate practice writing. " +
        "The task they were given was: \"" +
        viewed.x +
        "\"\n\nHere is what they wrote:\n\"" +
        draft +
        "\"\n\nGive concise, encouraging feedback in English: (1) briefly note whether they met the content and length target, " +
        "(2) address the specific grammar checkpoint mentioned in the task if there is one, quoting their exact phrase and the correction, " +
        "(3) point out up to two other notable errors the same way, (4) end with one short tip for next time. " +
        "Keep the whole reply under 150 words. Be warm but direct.";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = (data.content || [])
        .map((block) => (block.type === "text" ? block.text : ""))
        .filter(Boolean)
        .join("\n")
        .trim();
      if (!text) throw new Error("empty response");
      const next = { ...entriesRef.current, [viewDay]: { ...(entriesRef.current[viewDay] || {}), text: draft, feedback: text } };
      entriesRef.current = next;
      setEntries(next);
      persist("writing-entries", next);
      setFeedbackState("idle");
    } catch (e) {
      setFeedbackState("error");
    }
  }

  function completeDay() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      persist("writing-entries", entriesRef.current);
    }
    const todayKeyStr = todayKey();
    let streak = progress.streak_count;
    let longest = progress.longest_streak;
    if (progress.last_activity_date !== todayKeyStr) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = progress.last_activity_date === yesterday ? streak + 1 : 1;
      longest = Math.max(longest, streak);
    }
    const newCompleted = [...progress.completed_days, viewed.d];
    const newProgress = {
      current_day: progress.current_day + 1,
      completed_days: newCompleted,
      last_activity_date: todayKeyStr,
      streak_count: streak,
      longest_streak: longest,
    };
    setProgress(newProgress);
    persist("writing-progress", newProgress);
    setCompletionInfo({ day: viewed.d, remaining: WRITING_TOTAL - newCompleted.length, streak });
    setPhase(newProgress.current_day > WRITING_TOTAL ? "finished" : "complete");
  }

  function continueNext() {
    if (progress.current_day > WRITING_TOTAL) {
      setPhase("finished");
      return;
    }
    switchToDay(progress.current_day);
    setPhase("day");
  }

  function doReset() {
    setProgress(WRITING_FRESH_PROGRESS);
    setEntries({});
    entriesRef.current = {};
    persist("writing-progress", WRITING_FRESH_PROGRESS);
    persist("writing-entries", {});
    setConfirmingReset(false);
    switchToDay(1);
    setPhase("day");
  }

  const totalDone = progress.completed_days.length;
  const pct = Math.round((totalDone / WRITING_TOTAL) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished" ? "Writing plan complete" : "Day " + viewDay + " of " + WRITING_TOTAL}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: COLORS.accentSoft }}>
          <Flame size={14} color={progress.streak_count > 0 ? "#F59E0B" : COLORS.muted} />
          <span className="text-xs font-medium" style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}>
            {progress.streak_count}
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: COLORS.accent }} />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalDone} days done · {WRITING_TOTAL - totalDone} to go
      </div>
    </div>
  );

  const ResetControl = (
    <div className="w-full max-w-md mx-auto px-5 pb-6 pt-2">
      {!confirmingReset ? (
        <button onClick={() => setConfirmingReset(true)} className="text-xs flex items-center gap-1.5 mx-auto" style={{ color: COLORS.muted }}>
          <RotateCcw size={12} />
          Reset progress
        </button>
      ) : (
        <div className="flex items-center justify-center gap-3 text-xs p-3 rounded-xl" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <span style={{ color: COLORS.text }}>Erase all saved progress and writing?</span>
          <button onClick={doReset} className="font-medium" style={{ color: "#F87171" }}>
            Yes, reset
          </button>
          <button onClick={() => setConfirmingReset(false)} style={{ color: COLORS.muted }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  const wrapStyle = { background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" };

  if (phase === "loading") {
    return (
      <div style={wrapStyle} className="flex items-center justify-center min-h-screen p-6">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Loading your session…
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            All {WRITING_TOTAL} days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The writing module is finished.
          </div>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (phase === "complete" && completionInfo) {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Day {completionInfo.day} done
          </div>
          <div className="text-sm mb-6" style={{ color: COLORS.muted }}>
            {completionInfo.remaining} days left · streak {completionInfo.streak}
          </div>
          <button onClick={continueNext} className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: COLORS.accent, color: "#0B1220" }}>
            Start next day
          </button>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (!viewed) {
    return (
      <div style={wrapStyle} className="min-h-screen flex items-center justify-center">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Nothing to show.
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      <GlobalStyle />
      {Header}

      {!storageOk && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.hardSoft, color: "#F5C77E" }}>
            Progress isn't saving right now — it may be lost if you reload.
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-5 pt-2 pb-6">
        <div className="w-full max-w-md">
          {viewDay !== progress.current_day && (
            <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
              Your current day is Day {Math.min(progress.current_day, WRITING_TOTAL)} — you can still edit this entry.
            </div>
          )}

          <div className="relative w-full">
            <button
              onClick={goPrevPage}
              disabled={viewDay <= 1}
              aria-label="Previous page"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay <= 1 ? 0.35 : 1,
                cursor: viewDay <= 1 ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={18} color={COLORS.text} />
            </button>

            <div
              className="rounded-2xl p-6 w-full flex flex-col gap-4"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
            >
              <div className="text-sm leading-relaxed text-center w-full">{viewed.x}</div>

              <div>
                <textarea
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  placeholder="Écrivez ici…"
                  className="w-full text-sm rounded-lg p-3 leading-relaxed"
                  style={{
                    background: COLORS.bg,
                    border: "1px solid " + COLORS.border,
                    color: COLORS.text,
                    minHeight: "160px",
                    resize: "vertical",
                  }}
                />
                <div className="flex items-center justify-between mt-1.5 px-0.5">
                  <span className="text-xs" style={{ color: COLORS.muted }}>
                    {wordTarget ? wordCount + " / " + wordTarget + " words" : wordCount + " words"}
                  </span>
                  <span className="text-xs" style={{ color: COLORS.muted }}>
                    {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
                  </span>
                </div>
              </div>

              <button
                onClick={getFeedback}
                disabled={!draft.trim() || feedbackState === "loading"}
                className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                style={{
                  background: COLORS.goldSoft,
                  color: COLORS.gold,
                  opacity: !draft.trim() ? 0.5 : 1,
                  cursor: !draft.trim() ? "default" : "pointer",
                }}
              >
                {feedbackState === "loading" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {feedbackState === "loading" ? "Getting feedback…" : "Get feedback"}
              </button>

              {feedbackState === "error" && (
                <div className="text-xs text-center" style={{ color: "#F87171" }}>
                  Couldn't get feedback — check your connection and try again.
                </div>
              )}

              {currentFeedback && feedbackState !== "loading" && (
                <div className="pt-4" style={{ borderTop: "1px solid " + COLORS.border }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={13} color={COLORS.gold} />
                    <span className="text-xs font-medium" style={{ color: COLORS.gold }}>
                      Feedback
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{currentFeedback}</div>
                </div>
              )}
            </div>

            <button
              onClick={goNextPage}
              disabled={viewDay >= WRITING_TOTAL}
              aria-label="Next page"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay >= WRITING_TOTAL ? 0.35 : 1,
                cursor: viewDay >= WRITING_TOTAL ? "default" : "pointer",
              }}
            >
              <ChevronRight size={18} color={COLORS.text} />
            </button>
          </div>

          {isPendingDay && (
            <button
              onClick={completeDay}
              className="w-full mt-4 py-3.5 rounded-xl text-sm font-medium"
              style={{ background: COLORS.accent, color: "#0B1220" }}
            >
              Mark day complete
            </button>
          )}
        </div>
      </div>

      {ResetControl}
    </div>
  );
}


function buildTv5SearchUrl(text) {
  const q = "site:tv5monde.com " + text;
  return "https://www.google.com/search?q=" + encodeURIComponent(q);
}

const TV5_FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

function Tv5Module({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(TV5_FRESH_PROGRESS);
  const [storageOk, setStorageOk] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      const present = await waitForStorage(10, 300);
      if (present) {
        try {
          const r = await window.storage.get("tv5-progress", false);
          if (r && r.value) p = JSON.parse(r.value);
        } catch (e) {}
      }
      const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || TV5_FRESH_PROGRESS;
      setProgress(finalProgress);
      setStorageOk(diag.ok);
      setViewDay(startDay ? Math.max(1, Math.min(startDay, TV5_TOTAL)) : Math.min(finalProgress.current_day, TV5_TOTAL));
      setPhase("day");
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      }
    } catch (e) {
      setStorageOk(false);
    }
  }

  const viewIdx = viewDay - 1;
  const viewed = viewIdx >= 0 && viewIdx < TV5_TOTAL ? TV5_DAYS[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= TV5_TOTAL;

  function goPrevPage() {
    setViewDay((d) => Math.max(1, d - 1));
  }

  function goNextPage() {
    setViewDay((d) => Math.min(TV5_TOTAL, d + 1));
  }

  function completeDay() {
    const todayKeyStr = todayKey();
    let streak = progress.streak_count;
    let longest = progress.longest_streak;
    if (progress.last_activity_date !== todayKeyStr) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = progress.last_activity_date === yesterday ? streak + 1 : 1;
      longest = Math.max(longest, streak);
    }
    const newCompleted = [...progress.completed_days, viewed.d];
    const newProgress = {
      current_day: progress.current_day + 1,
      completed_days: newCompleted,
      last_activity_date: todayKeyStr,
      streak_count: streak,
      longest_streak: longest,
    };
    setProgress(newProgress);
    persist("tv5-progress", newProgress);
    setCompletionInfo({ day: viewed.d, remaining: TV5_TOTAL - newCompleted.length, streak });
    setPhase(newProgress.current_day > TV5_TOTAL ? "finished" : "complete");
  }

  function continueNext() {
    if (progress.current_day > TV5_TOTAL) {
      setPhase("finished");
      return;
    }
    setViewDay(progress.current_day);
    setPhase("day");
  }

  function doReset() {
    setProgress(TV5_FRESH_PROGRESS);
    persist("tv5-progress", TV5_FRESH_PROGRESS);
    setConfirmingReset(false);
    setViewDay(1);
    setPhase("day");
  }

  const totalDone = progress.completed_days.length;
  const pct = Math.round((totalDone / TV5_TOTAL) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished" ? "TV5MONDE plan complete" : "Day " + viewDay + " of " + TV5_TOTAL}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: COLORS.accentSoft }}>
          <Flame size={14} color={progress.streak_count > 0 ? "#F59E0B" : COLORS.muted} />
          <span className="text-xs font-medium" style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}>
            {progress.streak_count}
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: COLORS.accent }} />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalDone} days done · {TV5_TOTAL - totalDone} to go
      </div>
    </div>
  );

  const ResetControl = (
    <div className="w-full max-w-md mx-auto px-5 pb-6 pt-2">
      {!confirmingReset ? (
        <button onClick={() => setConfirmingReset(true)} className="text-xs flex items-center gap-1.5 mx-auto" style={{ color: COLORS.muted }}>
          <RotateCcw size={12} />
          Reset progress
        </button>
      ) : (
        <div className="flex items-center justify-center gap-3 text-xs p-3 rounded-xl" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <span style={{ color: COLORS.text }}>Erase all saved progress?</span>
          <button onClick={doReset} className="font-medium" style={{ color: "#F87171" }}>
            Yes, reset
          </button>
          <button onClick={() => setConfirmingReset(false)} style={{ color: COLORS.muted }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  const wrapStyle = { background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" };

  if (phase === "loading") {
    return (
      <div style={wrapStyle} className="flex items-center justify-center min-h-screen p-6">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Loading your session…
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            All {TV5_TOTAL} days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The TV5MONDE module is finished.
          </div>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (phase === "complete" && completionInfo) {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Day {completionInfo.day} done
          </div>
          <div className="text-sm mb-6" style={{ color: COLORS.muted }}>
            {completionInfo.remaining} days left · streak {completionInfo.streak}
          </div>
          <button onClick={continueNext} className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: COLORS.accent, color: "#0B1220" }}>
            Start next day
          </button>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (!viewed) {
    return (
      <div style={wrapStyle} className="min-h-screen flex items-center justify-center">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Nothing to show.
        </div>
      </div>
    );
  }

  const chips = splitLessonChips(viewed.x.replace(/^(Première classe|A1-A2|A2-B1|B1-B2|A1|A2|B1|B2)\s*:\s*/, ""));

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      <GlobalStyle />
      {Header}

      {!storageOk && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.hardSoft, color: "#F5C77E" }}>
            Progress isn't saving right now — it may be lost if you reload.
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-5 pt-2">
        <div className="w-full max-w-md">
          {viewDay !== progress.current_day && (
            <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
              Reading only — your current day is Day {Math.min(progress.current_day, TV5_TOTAL)}
            </div>
          )}

          <div className="relative w-full">
            <button
              onClick={goPrevPage}
              disabled={viewDay <= 1}
              aria-label="Previous page"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay <= 1 ? 0.35 : 1,
                cursor: viewDay <= 1 ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={18} color={COLORS.text} />
            </button>

            <div
              className="rounded-2xl p-6 w-full flex flex-col items-center justify-center gap-4"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border, minHeight: "220px" }}
            >
              {viewed.l && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: COLORS.accentSoft, color: "#93C5FD" }}
                >
                  {viewed.l}
                </span>
              )}

              <div className="text-sm leading-relaxed text-center w-full">{chips.length > 0 ? chips.join(" · ") : viewed.x}</div>

              <div className="w-full flex flex-col gap-2">
                {chips.map((chip, i) => (
                  <a
                    key={i}
                    href={buildTv5SearchUrl(chip)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                    style={{ background: COLORS.accentSoft, color: "#93C5FD" }}
                  >
                    <Tv size={12} className="shrink-0" />
                    <span className="flex-1 truncate">{chip}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <button
              onClick={goNextPage}
              disabled={viewDay >= TV5_TOTAL}
              aria-label="Next page"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay >= TV5_TOTAL ? 0.35 : 1,
                cursor: viewDay >= TV5_TOTAL ? "default" : "pointer",
              }}
            >
              <ChevronRight size={18} color={COLORS.text} />
            </button>
          </div>

          {isPendingDay && (
            <button
              onClick={completeDay}
              className="w-full mt-4 py-3.5 rounded-xl text-sm font-medium"
              style={{ background: COLORS.accent, color: "#0B1220" }}
            >
              Mark day complete
            </button>
          )}
        </div>
      </div>

      {ResetControl}
    </div>
  );
}


function KwiziqModule({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(KWIZIQ_FRESH_PROGRESS);
  const [storageOk, setStorageOk] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      const present = await waitForStorage(10, 300);
      if (present) {
        try {
          const r = await window.storage.get("kwiziq-progress", false);
          if (r && r.value) p = JSON.parse(r.value);
        } catch (e) {}
      }
      const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || KWIZIQ_FRESH_PROGRESS;
      setProgress(finalProgress);
      setStorageOk(diag.ok);
      setViewDay(startDay ? Math.max(1, Math.min(startDay, KWIZIQ_TOTAL)) : Math.min(finalProgress.current_day, KWIZIQ_TOTAL));
      setPhase("day");
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      }
    } catch (e) {
      setStorageOk(false);
    }
  }

  const viewIdx = viewDay - 1;
  const viewed = viewIdx >= 0 && viewIdx < KWIZIQ_TOTAL ? KWIZIQ_DAYS[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= KWIZIQ_TOTAL;

  function goPrevPage() {
    setViewDay((d) => Math.max(1, d - 1));
  }

  function goNextPage() {
    setViewDay((d) => Math.min(KWIZIQ_TOTAL, d + 1));
  }

  function completeDay() {
    const todayKeyStr = todayKey();
    let streak = progress.streak_count;
    let longest = progress.longest_streak;
    if (progress.last_activity_date !== todayKeyStr) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = progress.last_activity_date === yesterday ? streak + 1 : 1;
      longest = Math.max(longest, streak);
    }
    const newCompleted = [...progress.completed_days, viewed.d];
    const newProgress = {
      current_day: progress.current_day + 1,
      completed_days: newCompleted,
      last_activity_date: todayKeyStr,
      streak_count: streak,
      longest_streak: longest,
    };
    setProgress(newProgress);
    persist("kwiziq-progress", newProgress);
    setCompletionInfo({ day: viewed.d, remaining: KWIZIQ_TOTAL - newCompleted.length, streak });
    setPhase(newProgress.current_day > KWIZIQ_TOTAL ? "finished" : "complete");
  }

  function continueNext() {
    if (progress.current_day > KWIZIQ_TOTAL) {
      setPhase("finished");
      return;
    }
    setViewDay(progress.current_day);
    setPhase("day");
  }

  function doReset() {
    setProgress(KWIZIQ_FRESH_PROGRESS);
    persist("kwiziq-progress", KWIZIQ_FRESH_PROGRESS);
    setConfirmingReset(false);
    setViewDay(1);
    setPhase("day");
  }

  const totalDone = progress.completed_days.length;
  const pct = Math.round((totalDone / KWIZIQ_TOTAL) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished" ? "Kwiziq plan complete" : "Day " + viewDay + " of " + KWIZIQ_TOTAL}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: COLORS.accentSoft }}>
          <Flame size={14} color={progress.streak_count > 0 ? "#F59E0B" : COLORS.muted} />
          <span className="text-xs font-medium" style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}>
            {progress.streak_count}
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: COLORS.accent }} />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalDone} days done · {KWIZIQ_TOTAL - totalDone} to go
      </div>
    </div>
  );

  const ResetControl = (
    <div className="w-full max-w-md mx-auto px-5 pb-6 pt-2">
      {!confirmingReset ? (
        <button onClick={() => setConfirmingReset(true)} className="text-xs flex items-center gap-1.5 mx-auto" style={{ color: COLORS.muted }}>
          <RotateCcw size={12} />
          Reset progress
        </button>
      ) : (
        <div className="flex items-center justify-center gap-3 text-xs p-3 rounded-xl" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <span style={{ color: COLORS.text }}>Erase all saved progress?</span>
          <button onClick={doReset} className="font-medium" style={{ color: "#F87171" }}>
            Yes, reset
          </button>
          <button onClick={() => setConfirmingReset(false)} style={{ color: COLORS.muted }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  const wrapStyle = { background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" };

  if (phase === "loading") {
    return (
      <div style={wrapStyle} className="flex items-center justify-center min-h-screen p-6">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Loading your session…
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            All {KWIZIQ_TOTAL} days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The Kwiziq module is finished.
          </div>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (phase === "complete" && completionInfo) {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Day {completionInfo.day} done
          </div>
          <div className="text-sm mb-6" style={{ color: COLORS.muted }}>
            {completionInfo.remaining} days left · streak {completionInfo.streak}
          </div>
          <button onClick={continueNext} className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: COLORS.accent, color: "#0B1220" }}>
            Start next day
          </button>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (!viewed) {
    return (
      <div style={wrapStyle} className="min-h-screen flex items-center justify-center">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Nothing to show.
        </div>
      </div>
    );
  }

  const chips = splitLessonChips(viewed.x);

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      <GlobalStyle />
      {Header}

      {!storageOk && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.hardSoft, color: "#F5C77E" }}>
            Progress isn't saving right now — it may be lost if you reload.
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-5 pt-2">
        <div className="w-full max-w-md">
          {viewDay !== progress.current_day && (
            <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
              Reading only — your current day is Day {Math.min(progress.current_day, KWIZIQ_TOTAL)}
            </div>
          )}

          <div className="relative w-full">
            <button
              onClick={goPrevPage}
              disabled={viewDay <= 1}
              aria-label="Previous page"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay <= 1 ? 0.35 : 1,
                cursor: viewDay <= 1 ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={18} color={COLORS.text} />
            </button>

            <div
              className="rounded-2xl p-6 w-full flex flex-col items-center justify-center gap-4"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border, minHeight: "220px" }}
            >
              <div className="text-sm leading-relaxed text-center w-full">{viewed.x}</div>

              <div className="w-full flex flex-col gap-2">
                {chips.map((chip, i) => (
                  <a
                    key={i}
                    href={buildGoogleSearchUrl(chip)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                    style={{ background: COLORS.accentSoft, color: "#93C5FD" }}
                  >
                    <Search size={12} className="shrink-0" />
                    <span className="flex-1 truncate">{chip}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <button
              onClick={goNextPage}
              disabled={viewDay >= KWIZIQ_TOTAL}
              aria-label="Next page"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay >= KWIZIQ_TOTAL ? 0.35 : 1,
                cursor: viewDay >= KWIZIQ_TOTAL ? "default" : "pointer",
              }}
            >
              <ChevronRight size={18} color={COLORS.text} />
            </button>
          </div>

          {isPendingDay && (
            <button
              onClick={completeDay}
              className="w-full mt-4 py-3.5 rounded-xl text-sm font-medium"
              style={{ background: COLORS.accent, color: "#0B1220" }}
            >
              Mark day complete
            </button>
          )}
        </div>
      </div>

      {ResetControl}
    </div>
  );
}

function GrammarModule({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(GRAMMAR_FRESH_PROGRESS);
  const [storageOk, setStorageOk] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      const present = await waitForStorage(10, 300);
      if (present) {
        try {
          const r = await window.storage.get("grammar-progress", false);
          if (r && r.value) p = JSON.parse(r.value);
        } catch (e) {}
      }
      const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || GRAMMAR_FRESH_PROGRESS;
      setProgress(finalProgress);
      setStorageOk(diag.ok);
      setViewDay(startDay ? Math.max(1, Math.min(startDay, GRAMMAR_TOTAL)) : Math.min(finalProgress.current_day, GRAMMAR_TOTAL));
      setPhase("day");
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      }
    } catch (e) {
      setStorageOk(false);
    }
  }

  const viewIdx = viewDay - 1;
  const viewed = viewIdx >= 0 && viewIdx < GRAMMAR_TOTAL ? GRAMMAR_DAYS[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= GRAMMAR_TOTAL;

  const bookGroups = viewed
    ? Object.values(
        viewed.e.reduce((acc, entry) => {
          if (!acc[entry.b]) acc[entry.b] = { book: entry.b, chapters: [] };
          acc[entry.b].chapters.push(...entry.c);
          return acc;
        }, {})
      )
    : [];

  async function openChapterPages(book, chapters) {
    setPdfLoading(true);
    setPdfError("");
    try {
      const blob = await fetchGrammarPages(book, chapters);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      setPdfError("Couldn't load those pages. Try again.");
    } finally {
      setPdfLoading(false);
    }
  }

  function goPrevPage() {
    setViewDay((d) => Math.max(1, d - 1));
  }

  function goNextPage() {
    setViewDay((d) => Math.min(GRAMMAR_TOTAL, d + 1));
  }

  function completeDay() {
    const todayKeyStr = todayKey();
    let streak = progress.streak_count;
    let longest = progress.longest_streak;
    if (progress.last_activity_date !== todayKeyStr) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = progress.last_activity_date === yesterday ? streak + 1 : 1;
      longest = Math.max(longest, streak);
    }
    const newCompleted = [...progress.completed_days, viewed.d];
    const newProgress = {
      current_day: progress.current_day + 1,
      completed_days: newCompleted,
      last_activity_date: todayKeyStr,
      streak_count: streak,
      longest_streak: longest,
    };
    setProgress(newProgress);
    persist("grammar-progress", newProgress);
    setCompletionInfo({ day: viewed.d, remaining: GRAMMAR_TOTAL - newCompleted.length, streak });
    setPhase(newProgress.current_day > GRAMMAR_TOTAL ? "finished" : "complete");
  }

  function continueNext() {
    if (progress.current_day > GRAMMAR_TOTAL) {
      setPhase("finished");
      return;
    }
    setViewDay(progress.current_day);
    setPhase("day");
  }

  function doReset() {
    setProgress(GRAMMAR_FRESH_PROGRESS);
    persist("grammar-progress", GRAMMAR_FRESH_PROGRESS);
    setConfirmingReset(false);
    setViewDay(1);
    setPhase("day");
  }

  const totalDone = progress.completed_days.length;
  const pct = Math.round((totalDone / GRAMMAR_TOTAL) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished" ? "Grammar plan complete" : "Day " + viewDay + " of " + GRAMMAR_TOTAL}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: COLORS.accentSoft }}>
          <Flame size={14} color={progress.streak_count > 0 ? "#F59E0B" : COLORS.muted} />
          <span className="text-xs font-medium" style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}>
            {progress.streak_count}
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: COLORS.accent }} />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalDone} days done · {GRAMMAR_TOTAL - totalDone} to go
      </div>
    </div>
  );

  const ResetControl = (
    <div className="w-full max-w-md mx-auto px-5 pb-6 pt-2">
      {!confirmingReset ? (
        <button onClick={() => setConfirmingReset(true)} className="text-xs flex items-center gap-1.5 mx-auto" style={{ color: COLORS.muted }}>
          <RotateCcw size={12} />
          Reset progress
        </button>
      ) : (
        <div className="flex items-center justify-center gap-3 text-xs p-3 rounded-xl" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <span style={{ color: COLORS.text }}>Erase all saved progress?</span>
          <button onClick={doReset} className="font-medium" style={{ color: "#F87171" }}>
            Yes, reset
          </button>
          <button onClick={() => setConfirmingReset(false)} style={{ color: COLORS.muted }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  const wrapStyle = { background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" };

  if (phase === "loading") {
    return (
      <div style={wrapStyle} className="flex items-center justify-center min-h-screen p-6">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Loading your session…
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            All {GRAMMAR_TOTAL} days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The grammar module is finished.
          </div>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (phase === "complete" && completionInfo) {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Day {completionInfo.day} done
          </div>
          <div className="text-sm mb-6" style={{ color: COLORS.muted }}>
            {completionInfo.remaining} days left · streak {completionInfo.streak}
          </div>
          <button onClick={continueNext} className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: COLORS.accent, color: "#0B1220" }}>
            Start next day
          </button>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (!viewed) {
    return (
      <div style={wrapStyle} className="min-h-screen flex items-center justify-center">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Nothing to show.
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      <GlobalStyle />
      {Header}

      {!storageOk && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.hardSoft, color: "#F5C77E" }}>
            Progress isn't saving right now — it may be lost if you reload.
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-5 pt-2">
        <div className="w-full max-w-md">
          {viewDay !== progress.current_day && (
            <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
              Reading only — your current day is Day {Math.min(progress.current_day, GRAMMAR_TOTAL)}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={goPrevPage}
              disabled={viewDay <= 1}
              aria-label="Previous page"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay <= 1 ? 0.35 : 1,
                cursor: viewDay <= 1 ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={18} color={COLORS.text} />
            </button>

            <div
              className="rounded-2xl p-8 flex-1 flex items-center justify-center"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border, minHeight: "220px" }}
            >
              <div className="text-sm leading-relaxed text-center">{viewed.x}</div>
            </div>

            <button
              onClick={goNextPage}
              disabled={viewDay >= GRAMMAR_TOTAL}
              aria-label="Next page"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay >= GRAMMAR_TOTAL ? 0.35 : 1,
                cursor: viewDay >= GRAMMAR_TOTAL ? "default" : "pointer",
              }}
            >
              <ChevronRight size={18} color={COLORS.text} />
            </button>
          </div>

          {bookGroups.length > 0 && (
            <div className="w-full mt-3 flex flex-col gap-2">
              {bookGroups.map((g) => (
                <button
                  key={g.book}
                  onClick={() => openChapterPages(g.book, g.chapters)}
                  disabled={pdfLoading}
                  className="w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                  style={{ background: COLORS.accentSoft, color: "#93C5FD", opacity: pdfLoading ? 0.6 : 1 }}
                >
                  <BookOpen size={14} />
                  {pdfLoading ? "Loading pages…" : "Open " + g.book + " ch. " + g.chapters.join(", ")}
                </button>
              ))}
              {pdfError && (
                <div className="text-xs text-center" style={{ color: "#F87171" }}>
                  {pdfError}
                </div>
              )}
            </div>
          )}

          {isPendingDay && (
            <button
              onClick={completeDay}
              className="w-full mt-4 py-3.5 rounded-xl text-sm font-medium"
              style={{ background: COLORS.accent, color: "#0B1220" }}
            >
              Mark day complete
            </button>
          )}
        </div>
      </div>

      {ResetControl}
    </div>
  );
}

function AnkiModule({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(FRESH_PROGRESS);
  const [hardWords, setHardWords] = useState(new Set());
  const [cardStats, setCardStats] = useState({});
  const [session, setSession] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [storageOk, setStorageOk] = useState(true);
  const [storageDiag, setStorageDiag] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isPracticeSession, setIsPracticeSession] = useState(false);
  const voiceRef = useRef(null);

  useEffect(() => {
    loadFrenchVoice().then((v) => {
      voiceRef.current = v;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      let hw = [];
      let cs = {};
      const present = await waitForStorage(10, 300);
      const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
      if (diag.ok) {
        try {
          const r = await window.storage.get("progress", false);
          if (r && r.value) p = JSON.parse(r.value);
        } catch (e) {}
        try {
          const r = await window.storage.get("hard-words", false);
          if (r && r.value) hw = JSON.parse(r.value);
        } catch (e) {}
        try {
          const r = await window.storage.get("card-stats", false);
          if (r && r.value) cs = JSON.parse(r.value);
        } catch (e) {}
      }
      if (cancelled) return;
      const finalProgress = p || FRESH_PROGRESS;
      setProgress(finalProgress);
      setHardWords(new Set(hw));
      setCardStats(cs);
      setStorageOk(diag.ok);
      setStorageDiag(diag.message);
      if (startDay) {
        // Opened from Level/Day browsing: launch a bonus practice session for
        // that specific day, leaving real progress/streak untouched.
        const clamped = Math.max(1, Math.min(startDay, TOTAL_DAYS));
        const sess = buildSession({ ...finalProgress, current_day: clamped }, new Set(hw));
        setSession(sess);
        setIsPracticeSession(true);
        setQIndex(0);
        setRevealed(false);
        setPhase("session");
      } else if (finalProgress.current_day > TOTAL_DAYS) {
        setPhase("finished");
      } else {
        const sess = buildSession(finalProgress, new Set(hw));
        setSession(sess);
        setQIndex(0);
        setRevealed(false);
        setPhase("session");
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }, []);

  const currentItem = session ? session.queue[qIndex] : null;

  useEffect(() => {
    if (!currentItem) return;
    // FE = French shown as the prompt itself -> speak it right away.
    if (currentItem.dir === "FE" && !revealed) {
      speak(currentItem.f);
    }
  }, [currentItem, speak]);

  useEffect(() => {
    // EF = French only appears once revealed (it's the answer) -> speak on reveal.
    if (currentItem && currentItem.dir === "EF" && revealed) {
      speak(currentItem.f);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  async function persist(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      }
    } catch (e) {
      setStorageOk(false);
    }
  }

  function toggleHard(cardId) {
    setHardWords((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
        setCardStats((prevStats) => {
          const s = prevStats[cardId] || { times_seen: 0, times_marked_hard_total: 0, last_seen_day: null };
          const updated = { ...prevStats, [cardId]: { ...s, times_marked_hard_total: s.times_marked_hard_total + 1 } };
          persist("card-stats", updated);
          return updated;
        });
      }
      persist("hard-words", Array.from(next));
      return next;
    });
  }

  function handleShowAnswer() {
    if (!currentItem || revealed) return;
    setRevealed(true);
  }

  function goToNextWord() {
    if (!currentItem) return;
    const nextIndex = qIndex + 1;
    if (nextIndex >= session.queue.length) {
      finishSession();
    } else {
      setQIndex(nextIndex);
      setRevealed(false);
    }
  }

  function goToPrevWord() {
    if (qIndex === 0) return;
    setQIndex(qIndex - 1);
    setRevealed(false);
  }

  function finishSession() {
    if (isPracticeSession) {
      // Bonus practice: no progress, streak, or card-stat changes. Populate
      // completionInfo from real (unchanged) progress so the results screen
      // always has something coherent to show, whether this practice round
      // was launched from the normal completion screen or directly via
      // Level/Day browsing.
      setIsPracticeSession(false);
      setCompletionInfo({
        day: session.dayObj.d,
        remaining: TOTAL_DAYS - progress.completed_days.length,
        streak: progress.streak_count,
      });
      setPhase("complete");
      return;
    }
    const today = todayKey();
    let streak = progress.streak_count;
    let longest = progress.longest_streak;
    if (progress.last_activity_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (progress.last_activity_date === yesterday) {
        streak = streak + 1;
      } else {
        streak = 1;
      }
      longest = Math.max(longest, streak);
    }
    const newCompleted = [...progress.completed_days, session.dayObj.d];
    const newProgress = {
      current_day: progress.current_day + 1,
      completed_days: newCompleted,
      last_activity_date: today,
      streak_count: streak,
      longest_streak: longest,
    };
    setCardStats((prevStats) => {
      const newStats = { ...prevStats };
      for (const w of session.words) {
        const s = newStats[w.i] || { times_seen: 0, times_marked_hard_total: 0, last_seen_day: null };
        newStats[w.i] = { ...s, times_seen: s.times_seen + 1, last_seen_day: session.dayObj.d };
      }
      persist("card-stats", newStats);
      return newStats;
    });
    setProgress(newProgress);
    persist("progress", newProgress);
    setCompletionInfo({
      day: session.dayObj.d,
      remaining: TOTAL_DAYS - newCompleted.length,
      streak: streak,
    });
    setPhase(newProgress.current_day > TOTAL_DAYS ? "finished" : "complete");
  }

  function practiceDayAgain(day) {
    const sess = buildSession({ ...progress, current_day: day }, hardWords);
    setSession(sess);
    setIsPracticeSession(true);
    setQIndex(0);
    setRevealed(false);
    setPhase("session");
  }

  function continueToNextDay() {
    if (progress.current_day > TOTAL_DAYS) {
      setPhase("finished");
      return;
    }
    const sess = buildSession(progress, hardWords);
    setSession(sess);
    setQIndex(0);
    setRevealed(false);
    setPhase("session");
  }

  function doReset() {
    setProgress(FRESH_PROGRESS);
    setHardWords(new Set());
    setCardStats({});
    persist("progress", FRESH_PROGRESS);
    persist("hard-words", []);
    persist("card-stats", {});
    const sess = buildSession(FRESH_PROGRESS, new Set());
    setSession(sess);
    setQIndex(0);
    setRevealed(false);
    setConfirmingReset(false);
    setPhase("session");
  }

  useEffect(() => {
    function onKey(e) {
      if (phase !== "session") return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleShowAnswer();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        goToNextWord();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        goToPrevWord();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const wrapStyle = {
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'IBM Plex Sans', sans-serif",
  };

  const fontImport = <GlobalStyle />;

  if (phase === "loading") {
    return (
      <div style={wrapStyle} className="flex items-center justify-center min-h-screen p-6">
        {fontImport}
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Loading your session…
        </div>
      </div>
    );
  }

  const totalCurriculumDone = progress.completed_days.length;
  const curriculumPct = Math.round((totalCurriculumDone / TOTAL_DAYS) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished"
              ? "Plan complete"
              : isPracticeSession && session
              ? "Practicing Day " + session.dayObj.d + " of " + TOTAL_DAYS
              : "Day " + Math.min(progress.current_day, TOTAL_DAYS) + " of " + TOTAL_DAYS}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: COLORS.accentSoft }}>
          <Flame size={14} color={progress.streak_count > 0 ? "#F59E0B" : COLORS.muted} />
          <span className="text-xs font-medium" style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}>
            {progress.streak_count}
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: curriculumPct + "%", background: COLORS.accent }}
        />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalCurriculumDone} days done · {TOTAL_DAYS - totalCurriculumDone} to go
      </div>
    </div>
  );

  const ResetControl = (
    <div className="w-full max-w-md mx-auto px-5 pb-6 pt-2">
      {!confirmingReset ? (
        <button
          onClick={() => setConfirmingReset(true)}
          className="text-xs flex items-center gap-1.5 mx-auto"
          style={{ color: COLORS.muted }}
        >
          <RotateCcw size={12} />
          Reset progress
        </button>
      ) : (
        <div
          className="flex items-center justify-center gap-3 text-xs p-3 rounded-xl"
          style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
        >
          <span style={{ color: COLORS.text }}>Erase all saved progress?</span>
          <button onClick={doReset} className="font-medium" style={{ color: "#F87171" }}>
            Yes, reset
          </button>
          <button onClick={() => setConfirmingReset(false)} style={{ color: COLORS.muted }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  if (phase === "finished") {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        {fontImport}
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: COLORS.successSoft }}
          >
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            All 301 days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The vocabulary module is finished — nice work.
          </div>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (phase === "complete" && completionInfo) {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        {fontImport}
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: COLORS.successSoft }}
          >
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Day {completionInfo.day} done
          </div>
          <div className="text-sm mb-6" style={{ color: COLORS.muted }}>
            {completionInfo.remaining} days left · streak {completionInfo.streak}
          </div>
          <button
            onClick={continueToNextDay}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: COLORS.accent, color: "#0B1220" }}
          >
            Start next day
          </button>
          <button
            onClick={() => practiceDayAgain(completionInfo.day)}
            className="mt-3 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "transparent", color: COLORS.muted, border: "1px solid " + COLORS.border }}
          >
            Practice this day again
          </button>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div style={wrapStyle} className="min-h-screen flex items-center justify-center">
        {fontImport}
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Nothing to show.
        </div>
      </div>
    );
  }

  const isHard = hardWords.has(currentItem.i);
  const promptText = currentItem.dir === "EF" ? currentItem.e : currentItem.f;
  const answerText = currentItem.dir === "EF" ? currentItem.f : currentItem.e;
  const directionLabel = currentItem.dir === "EF" ? "English → French" : "French → English";
  const isLast = qIndex + 1 >= session.queue.length;
  const isFirst = qIndex === 0;
  const isReview = currentItem.sourceDay !== session.dayObj.d;

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      {fontImport}
      {Header}

      {!storageOk && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{ background: COLORS.hardSoft, color: "#F5C77E" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span>Progress isn't saving right now — it may be lost if you reload.</span>
              <button
                onClick={async () => {
                  const present = await waitForStorage(6, 250);
                  const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
                  setStorageOk(diag.ok);
                  setStorageDiag(diag.message);
                  if (diag.ok) {
                    persist("progress", progress);
                    persist("hard-words", Array.from(hardWords));
                    persist("card-stats", cardStats);
                  }
                }}
                className="underline shrink-0"
              >
                Retry
              </button>
            </div>
            {storageDiag && (
              <div className="mt-1 opacity-80 font-mono" style={{ fontSize: "10px" }}>
                {storageDiag}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-2 px-1">
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: COLORS.accentSoft, color: "#93C5FD" }}
            >
              {directionLabel}
            </span>
            <span className="text-xs" style={{ color: COLORS.muted }}>
              {qIndex + 1} / {session.queue.length}
              {isReview ? " · review" : " · new"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevWord}
              disabled={isFirst}
              aria-label="Previous word"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: isFirst ? 0.35 : 1,
                cursor: isFirst ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={18} color={COLORS.text} />
            </button>

            <div
              className="rounded-2xl p-8 flex-1 flex flex-col items-center justify-center relative"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border, minHeight: "260px" }}
            >
              <button
                onClick={() => toggleHard(currentItem.i)}
                className="absolute top-4 right-4 p-1.5 rounded-full transition-colors"
                style={{ background: isHard ? COLORS.hardSoft : "transparent" }}
                aria-label="Mark as hard"
              >
                <Flag size={16} color={isHard ? COLORS.hard : COLORS.muted} fill={isHard ? COLORS.hard : "none"} />
              </button>

              <div className="flex flex-col items-center justify-center text-center">
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.9rem", lineHeight: 1.25 }}>
                  {promptText}
                </div>

                {currentItem.dir === "FE" && !revealed && (
                  <button
                    onClick={() => speak(currentItem.f)}
                    className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{ color: COLORS.muted }}
                  >
                    <Volume2 size={13} />
                    Replay
                  </button>
                )}

                <div
                  className="w-full mt-5 pt-5 transition-opacity duration-300"
                  style={{
                    borderTop: revealed ? "1px solid " + COLORS.border : "1px solid transparent",
                    opacity: revealed ? 1 : 0,
                    minHeight: revealed ? "auto" : 0,
                  }}
                >
                  {revealed && (
                    <div className="flex items-center justify-center gap-2">
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }}>
                        {answerText}
                      </span>
                      {currentItem.dir === "EF" && (
                        <button onClick={() => speak(currentItem.f)} aria-label="Play pronunciation">
                          <Volume2 size={16} color={COLORS.muted} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={goToNextWord}
              aria-label={isLast ? "Finish day" : "Next word"}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: COLORS.accent }}
            >
              {isLast ? <Check size={18} color="#0B1220" /> : <ChevronRight size={18} color="#0B1220" />}
            </button>
          </div>

          <button
            onClick={handleShowAnswer}
            disabled={revealed}
            className="w-full mt-4 py-3.5 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2"
            style={{
              background: "transparent",
              color: revealed ? COLORS.muted : COLORS.text,
              border: "1px solid " + COLORS.border,
              opacity: revealed ? 0.5 : 1,
              cursor: revealed ? "default" : "pointer",
            }}
          >
            {revealed ? "Answer shown" : "Show answer"}
          </button>
        </div>
      </div>

      {ResetControl}
    </div>
  );
}

const LEVELS = [
  {
    id: "A0",
    label: "A0",
    title: "Absolute-beginner foundations",
    weeks: "Week 1",
    startDay: 1,
    endDay: 7,
    description:
      "Start from zero and build the minimum language needed to introduce yourself and participate in very simple exchanges.",
    goals: [
      "Use basic greetings, the French alphabet and essential classroom expressions.",
      "Say your name, location, nationality and profession in short sentences.",
    ],
  },
  {
    id: "A1",
    label: "A1",
    title: "Basic everyday communication",
    weeks: "Weeks 2–10",
    startDay: 8,
    endDay: 70,
    description:
      "Develop reliable beginner communication for familiar people, routines, shopping, travel, health, services, work and study.",
    goals: [
      "Understand and produce short, predictable everyday exchanges.",
      "Use present-tense basics, articles, agreement, questions, negation and common verbs.",
    ],
  },
  {
    id: "A2",
    label: "A2",
    title: "Independent everyday communication",
    weeks: "Weeks 11–20",
    startDay: 71,
    endDay: 140,
    description:
      "Move beyond memorized phrases and handle routine situations with longer descriptions, explanations and narratives.",
    goals: [
      "Compare choices, negotiate arrangements and resolve common practical problems.",
      "Describe past situations using passé composé and imparfait with growing control.",
    ],
  },
  {
    id: "B1",
    label: "B1",
    title: "Structured independent communication",
    weeks: "Weeks 21–35",
    startDay: 141,
    endDay: 245,
    description:
      "Build sustained, organized communication for professional, social and public-life topics while preparing for exam-style interaction.",
    goals: [
      "State, support, qualify and defend opinions with reasons and examples.",
      "Narrate experiences clearly and manage workplace or administrative situations.",
    ],
  },
  {
    id: "B2",
    label: "B2 / NCLC 7",
    title: "Exam performance and readiness",
    weeks: "Weeks 36–43",
    startDay: 246,
    endDay: 301,
    description:
      "Convert upper-intermediate French into stable NCLC 7-oriented performance under realistic time, interaction and stamina demands.",
    goals: [
      "Understand stance, structure, detail and supported implications in B2 material.",
      "Gather information, persuade and defend a position through sustained interaction.",
    ],
  },
];

const SECTIONS = [
  {
    id: "anki",
    name: "Anki vocabulary",
    tagline: "Daily flashcards, both directions",
    icon: BookOpen,
    active: true,
  },
  {
    id: "grammar",
    name: "Grammar book",
    tagline: "Grammaire Progressive du Français",
    icon: GraduationCap,
    active: true,
  },
  {
    id: "kwiziq",
    name: "Kwiziq",
    tagline: "Daily lesson links",
    icon: PenLine,
    active: true,
  },
  {
    id: "tv5monde",
    name: "TV5MONDE",
    tagline: "Daily listening links",
    icon: Tv,
    active: true,
  },
  {
    id: "writing",
    name: "Writing",
    tagline: "Daily writing task",
    icon: FileEdit,
    active: true,
  },
];

function RibbonDivider() {
  return (
    <svg viewBox="0 0 400 40" className="w-full" style={{ maxWidth: "280px" }} aria-hidden="true">
      <path
        d="M0 30 C 80 10, 140 34, 200 18 S 340 4, 400 20"
        fill="none"
        stroke={COLORS.frBlue}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M0 24 C 80 4, 140 28, 200 12 S 340 -2, 400 14"
        fill="none"
        stroke="#EDE7DA"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M0 18 C 80 -2, 140 22, 200 6 S 340 -8, 400 8"
        fill="none"
        stroke={COLORS.frRed}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

function CornerFlourish({ side }) {
  const isLeft = side === "left";
  return (
    <svg
      width="72"
      height="56"
      viewBox="0 0 72 56"
      style={{ position: "absolute", top: 18, [isLeft ? "left" : "right"]: 18, opacity: 0.5 }}
      aria-hidden="true"
    >
      {isLeft ? (
        <g stroke={COLORS.gold} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M4 4 C 20 10, 34 20, 44 34" />
          <ellipse cx="18" cy="9" rx="7" ry="3.2" transform="rotate(28 18 9)" fill={COLORS.gold} opacity="0.7" stroke="none" />
          <ellipse cx="28" cy="16" rx="6.4" ry="3" transform="rotate(35 28 16)" fill={COLORS.gold} opacity="0.55" stroke="none" />
          <ellipse cx="37" cy="26" rx="5.6" ry="2.6" transform="rotate(42 37 26)" fill={COLORS.gold} opacity="0.4" stroke="none" />
        </g>
      ) : (
        <g stroke={COLORS.accent} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
          <path d="M60 6 L64 20 L58 18 L56 30 L50 20 L44 24 L52 10 L56 14 Z" />
        </g>
      )}
    </svg>
  );
}

function HomeScreen({ onSelectSection, onBrowseLevels, onJumpToDay }) {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }} className="min-h-screen">
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-6 pt-10 pb-10 relative">
        <CornerFlourish side="left" />
        <CornerFlourish side="right" />

        <div className="text-center pt-6">
          <div
            className="text-xs font-semibold tracking-wide mb-3"
            style={{ color: COLORS.gold, letterSpacing: "0.08em" }}
          >
            A DAILY LANGUAGE JOURNEY
          </div>
          <h1
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "2.1rem", lineHeight: 1.15 }}
          >
            French NCLC 7
            <br />
            Preparation Plan
          </h1>
          <p className="text-sm mt-3" style={{ color: COLORS.muted }}>
            From absolute beginner to confident exam readiness
          </p>
        </div>

        <div className="flex justify-center my-7">
          <RibbonDivider />
        </div>

        <div
          className="grid grid-cols-3 rounded-xl overflow-hidden mb-8"
          style={{ border: "1px solid " + COLORS.border }}
        >
          {[
            { value: "301", label: "daily plans" },
            { value: "43", label: "weeks" },
            { value: "5", label: "sections" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="py-3 text-center"
              style={{
                background: COLORS.card,
                borderLeft: i > 0 ? "1px solid " + COLORS.border : "none",
              }}
            >
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem" }}>{stat.value}</div>
              <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => s.active && onSelectSection(s.id)}
                disabled={!s.active}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-colors"
                style={{
                  background: s.active ? COLORS.card : "transparent",
                  border: "1px solid " + (s.active ? COLORS.accent : COLORS.border),
                  opacity: s.active ? 1 : 0.55,
                  cursor: s.active ? "pointer" : "default",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: s.active ? COLORS.accentSoft : COLORS.card }}
                >
                  <Icon size={18} color={s.active ? COLORS.accent : COLORS.muted} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                    {s.tagline}
                  </div>
                </div>
                {s.active ? (
                  <ArrowRight size={16} color={COLORS.accent} />
                ) : (
                  <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: COLORS.muted }}>
                    <Lock size={12} />
                    Soon
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
            Other ways to navigate
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onBrowseLevels}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
            >
              <Layers size={18} color={COLORS.accent} />
              <div className="text-sm font-medium">Browse by level</div>
              <div className="text-xs" style={{ color: COLORS.muted }}>
                A0 to B2 / NCLC 7
              </div>
            </button>
            <button
              onClick={onJumpToDay}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
            >
              <Calendar size={18} color={COLORS.accent} />
              <div className="text-sm font-medium">Jump to a day</div>
              <div className="text-xs" style={{ color: COLORS.muted }}>
                Any day, 1–301
              </div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs mt-8" style={{ color: COLORS.muted }}>
          ~90 minutes a day · Listening · Speaking · Reading · Writing
        </div>
      </div>
    </div>
  );
}

function LevelsScreen({ onBack, onSelectLevel }) {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }} className="min-h-screen">
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Browse by level
          </div>
        </div>

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }} className="mb-1">
          Pick a level
        </h2>
        <p className="text-xs mb-6" style={{ color: COLORS.muted }}>
          Straight from the plan's own A0 → B2 / NCLC 7 roadmap.
        </p>

        <div className="space-y-2.5">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => onSelectLevel(lvl)}
              className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ background: COLORS.accentSoft }}
              >
                <span className="text-xs font-semibold" style={{ color: COLORS.accent }}>
                  {lvl.id}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{lvl.title}</div>
                <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                  {lvl.weeks}
                </div>
              </div>
              <ArrowRight size={16} color={COLORS.accent} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelDetailScreen({ level, onBack, onSelectSection }) {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }} className="min-h-screen">
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} aria-label="Back to levels" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Browse by level
          </div>
        </div>

        <div className="text-xs font-semibold mb-2" style={{ color: COLORS.gold, letterSpacing: "0.06em" }}>
          {level.label.toUpperCase()} · {level.weeks.toUpperCase()}
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.6rem" }} className="mb-3">
          {level.title}
        </h2>
        <p className="text-sm mb-4" style={{ color: COLORS.muted }}>
          {level.description}
        </p>

        <div className="rounded-2xl p-4 mb-6" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <div className="text-xs font-medium mb-2" style={{ color: COLORS.muted }}>
            Goals for this level
          </div>
          <ul className="space-y-1.5">
            {level.goals.map((g, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span style={{ color: COLORS.accent }}>◆</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
          Jump into a section at Day {level.startDay} — the start of this level
        </div>
        <div className="space-y-2.5">
          {SECTIONS.filter((s) => s.active).map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSection(s.id, level.startDay)}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left"
                style={{ background: COLORS.card, border: "1px solid " + COLORS.accent }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: COLORS.accentSoft }}
                >
                  <Icon size={18} color={COLORS.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.name}</div>
                </div>
                <ArrowRight size={16} color={COLORS.accent} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayJumpScreen({ onBack, onSelectSection }) {
  const [dayInput, setDayInput] = useState("");
  const [chosenDay, setChosenDay] = useState(null);

  function go() {
    const n = parseInt(dayInput, 10);
    if (n >= 1 && n <= TOTAL_DAYS) setChosenDay(n);
  }

  const ankiDay = chosenDay ? DAYS[chosenDay - 1] : null;
  const grammarDay = chosenDay ? GRAMMAR_DAYS[chosenDay - 1] : null;
  const kwiziqDay = chosenDay ? KWIZIQ_DAYS[chosenDay - 1] : null;
  const tv5Day = chosenDay ? TV5_DAYS[chosenDay - 1] : null;
  const writingDay = chosenDay ? WRITING_DAYS[chosenDay - 1] : null;

  const previewRow = (icon, label, id, body) => {
    const Icon = icon;
    return (
      <div className="rounded-2xl p-4" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={14} color={COLORS.accent} />
            <span className="text-xs font-medium">{label}</span>
          </div>
          <button onClick={() => onSelectSection(id, chosenDay)} className="text-xs font-medium" style={{ color: COLORS.accent }}>
            Open
          </button>
        </div>
        <div className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>
          {body}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }} className="min-h-screen">
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Jump to a day
          </div>
        </div>

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }} className="mb-4">
          Which day?
        </h2>

        <div className="flex gap-2 mb-6">
          <input
            type="number"
            min="1"
            max={TOTAL_DAYS}
            value={dayInput}
            onChange={(e) => setDayInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={"1–" + TOTAL_DAYS}
            className="flex-1 text-sm rounded-lg px-3 py-2.5"
            style={{ background: COLORS.card, border: "1px solid " + COLORS.border, color: COLORS.text }}
          />
          <button onClick={go} className="px-5 rounded-lg text-sm font-medium" style={{ background: COLORS.accent, color: "#0B1220" }}>
            Go
          </button>
        </div>

        {chosenDay && (
          <div className="space-y-3">
            <div className="text-xs mb-1 px-1" style={{ color: COLORS.muted }}>
              Day {chosenDay} · Week {Math.ceil(chosenDay / 7)}
            </div>

            {previewRow(BookOpen, "Anki", "anki", ankiDay.c.length + " new cards — " + ankiDay.c.slice(0, 3).map((c) => c.f).join(", ") + (ankiDay.c.length > 3 ? "…" : ""))}
            {previewRow(GraduationCap, "Grammar book", "grammar", grammarDay.x)}
            {previewRow(PenLine, "Kwiziq", "kwiziq", kwiziqDay.x)}
            {previewRow(Tv, "TV5MONDE", "tv5monde", (tv5Day.l ? tv5Day.l + " — " : "") + tv5Day.x.replace(/^(Première classe|A1-A2|A2-B1|B1-B2|A1|A2|B1|B2)\s*:\s*/, ""))}
            {previewRow(FileEdit, "Writing", "writing", writingDay.x)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [returnScreen, setReturnScreen] = useState("home");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [jumpDay, setJumpDay] = useState(null);

  function openSection(id, fromScreen, day) {
    setJumpDay(day || null);
    setReturnScreen(fromScreen);
    setScreen(id);
  }

  if (screen === "home") {
    return (
      <HomeScreen
        onSelectSection={(id) => openSection(id, "home", null)}
        onBrowseLevels={() => setScreen("levels")}
        onJumpToDay={() => setScreen("day-jump")}
      />
    );
  }
  if (screen === "levels") {
    return (
      <LevelsScreen
        onBack={() => setScreen("home")}
        onSelectLevel={(lvl) => {
          setSelectedLevel(lvl);
          setScreen("level-detail");
        }}
      />
    );
  }
  if (screen === "level-detail" && selectedLevel) {
    return (
      <LevelDetailScreen
        level={selectedLevel}
        onBack={() => setScreen("levels")}
        onSelectSection={(id, day) => openSection(id, "level-detail", day)}
      />
    );
  }
  if (screen === "day-jump") {
    return (
      <DayJumpScreen
        onBack={() => setScreen("home")}
        onSelectSection={(id, day) => openSection(id, "day-jump", day)}
      />
    );
  }
  if (screen === "grammar") {
    return <GrammarModule onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
  }
  if (screen === "kwiziq") {
    return <KwiziqModule onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
  }
  if (screen === "writing") {
    return <WritingModule onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
  }
  if (screen === "tv5monde") {
    return <Tv5Module onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
  }
  return <AnkiModule onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
}
