# Nom de l'image qui sera personnalisée
FROM ubuntu

# Nom du responsable
MAINTAINER Axel Seguin <axel.seguin@umontreal.ca>

# Commande permettant de lancer l'application ngnix
RUN apt-get update && apt-get -y install nginx

# On ouvre le port 80 pour le web
EXPOSE 80

# Commande lancée au démarrage du conteneur
# Ici on démarre ndinx au premier plan
CMD ["nginx", "-g", "daemon off;"]