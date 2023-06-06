# IFT3225 – TP1

### Instructions de build

Pour partir le projet, ouvrez d'abord un terminal dans le répertoire `/src`.

Ensuite, assurez-vous que Docker Desktop est en train de rouler et exécutez la commande :

```
docker build -t tp1 .
```

Vous devriez alors voir de l'output au terminal indiquant que
Docker est en train de build l'image.

Une fois le build terminé, exécutez la commande suivante :

```
docker run --name tp1 -p 80:80 -v ${pwd}:/var/www/html -d tp1
```

Le site web devrait maintenant être accessible via `localhost:80`.

Bonne correction.