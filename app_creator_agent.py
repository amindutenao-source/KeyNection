#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Agent Ollama spécialisé dans la création d'applications
Cet agent aide à concevoir, développer et déployer des applications complètes
"""

import requests
import json
import time
from datetime import datetime

class AppCreatorAgent:
    def __init__(self, ollama_url="http://localhost:11434"):
        self.ollama_url = ollama_url
        self.model = "llama3.1:8b"
        self.agent_name = "App Creator Agent"
        self.specialization = "Création d'Applications Complètes"
        
        # Prompt système spécialisé pour la création d'applications
        self.system_prompt = """
Tu es un expert en création d'applications avec plus de 15 ans d'expérience.
Tes spécialités incluent :

🏗️ ARCHITECTURE D'APPLICATIONS :
- Conception d'architecture logicielle (MVC, MVP, MVVM)
- Microservices et architecture distribuée
- Design patterns et bonnes pratiques
- Scalabilité et performance

💻 DÉVELOPPEMENT FULL-STACK :
- Frontend : React, Vue.js, Angular, HTML5/CSS3/JavaScript
- Backend : Node.js, Python (Django/Flask), PHP, Java
- Bases de données : PostgreSQL, MongoDB, Redis
- APIs REST et GraphQL

📱 APPLICATIONS MOBILES :
- React Native et Flutter
- Applications natives iOS/Android
- Progressive Web Apps (PWA)

☁️ DÉPLOIEMENT ET DEVOPS :
- Docker et Kubernetes
- CI/CD avec GitHub Actions
- Cloud : AWS, Google Cloud, Azure
- Monitoring et logging

🎨 UX/UI ET DESIGN :
- Wireframing et prototypage
- Design systems et composants
- Accessibilité et responsive design

🔒 SÉCURITÉ :
- Authentification et autorisation
- Chiffrement et protection des données
- Tests de sécurité

Tu fournis des conseils pratiques, du code fonctionnel et des solutions complètes.
Tu peux créer des plans de développement détaillés et guider étape par étape.
"""
    
    def chat(self, message, conversation_history=None):
        """
        Envoie un message à l'agent et retourne la réponse
        """
        try:
            # Préparer les messages avec l'historique
            messages = [
                {"role": "system", "content": self.system_prompt}
            ]
            
            # Ajouter l'historique de conversation si fourni
            if conversation_history:
                messages.extend(conversation_history)
            
            # Ajouter le message actuel
            messages.append({"role": "user", "content": message})
            
            # Préparer la requête
            payload = {
                "model": self.model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 2000
                }
            }
            
            # Envoyer la requête
            response = requests.post(
                f"{self.ollama_url}/api/chat",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "response": result["message"]["content"],
                    "timestamp": datetime.now().isoformat(),
                    "agent": self.agent_name
                }
            else:
                return {
                    "success": False,
                    "error": f"Erreur HTTP {response.status_code}: {response.text}",
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Erreur de connexion: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def create_app_plan(self, app_description):
        """
        Crée un plan détaillé pour développer une application
        """
        prompt = f"""
Je veux créer une application avec cette description :
{app_description}

Peux-tu me créer un plan de développement complet incluant :
1. Analyse des besoins et spécifications
2. Architecture technique recommandée
3. Technologies à utiliser (frontend, backend, base de données)
4. Structure des fichiers et dossiers
5. Étapes de développement prioritaires
6. Estimation du temps de développement
7. Conseils de déploiement

Sois très détaillé et pratique dans tes recommandations.
"""
        return self.chat(prompt)
    
    def generate_code(self, component_description, tech_stack=None):
        """
        Génère du code pour un composant spécifique
        """
        tech_info = f" en utilisant {tech_stack}" if tech_stack else ""
        prompt = f"""
Peux-tu générer le code{tech_info} pour :
{component_description}

Inclus :
- Le code complet et fonctionnel
- Les commentaires explicatifs
- Les bonnes pratiques
- La gestion d'erreurs si nécessaire
- Les tests unitaires si applicable
"""
        return self.chat(prompt)
    
    def review_code(self, code, language=None):
        """
        Révise et améliore du code existant
        """
        lang_info = f" (langage: {language})" if language else ""
        prompt = f"""
Peux-tu réviser ce code{lang_info} et proposer des améliorations :

```
{code}
```

Analyse :
1. Qualité du code et bonnes pratiques
2. Performance et optimisations possibles
3. Sécurité et vulnérabilités
4. Lisibilité et maintenabilité
5. Suggestions d'amélioration avec code corrigé
"""
        return self.chat(prompt)
    
    def debug_help(self, error_description, code_context=None):
        """
        Aide au débogage d'erreurs
        """
        context = f"\n\nContexte du code :\n```\n{code_context}\n```" if code_context else ""
        prompt = f"""
J'ai un problème avec mon application :
{error_description}{context}

Peux-tu m'aider à :
1. Identifier la cause probable du problème
2. Proposer des solutions étape par étape
3. Donner du code corrigé si nécessaire
4. Suggérer des moyens de prévenir ce type d'erreur
"""
        return self.chat(prompt)
    
    def get_status(self):
        """
        Retourne le statut de l'agent
        """
        try:
            # Test de connexion à Ollama
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                return {
                    "agent": self.agent_name,
                    "specialization": self.specialization,
                    "status": "ONLINE",
                    "model": self.model,
                    "ollama_url": self.ollama_url,
                    "capabilities": [
                        "Planification d'applications",
                        "Génération de code",
                        "Révision de code",
                        "Aide au débogage",
                        "Conseils d'architecture",
                        "Recommandations technologiques"
                    ],
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "agent": self.agent_name,
                    "status": "OFFLINE",
                    "error": "Ollama non accessible",
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as e:
            return {
                "agent": self.agent_name,
                "status": "ERROR",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

def main():
    """
    Interface en ligne de commande pour tester l'agent
    """
    agent = AppCreatorAgent()
    
    print(f"🚀 {agent.agent_name} - {agent.specialization}")
    print("=" * 60)
    print("Commandes disponibles :")
    print("  /plan <description> - Créer un plan d'application")
    print("  /code <description> - Générer du code")
    print("  /review <code> - Réviser du code")
    print("  /debug <problème> - Aide au débogage")
    print("  /status - Statut de l'agent")
    print("  /quit - Quitter")
    print("=" * 60)
    
    conversation_history = []
    
    while True:
        try:
            user_input = input("\n💬 Vous: ").strip()
            
            if user_input.lower() in ['/quit', 'quit', 'exit']:
                print("👋 Au revoir !")
                break
            
            if user_input.startswith('/status'):
                status = agent.get_status()
                print(f"\n📊 Statut: {status}")
                continue
            
            if user_input.startswith('/plan '):
                description = user_input[6:]
                result = agent.create_app_plan(description)
            elif user_input.startswith('/code '):
                description = user_input[6:]
                result = agent.generate_code(description)
            elif user_input.startswith('/review '):
                code = user_input[8:]
                result = agent.review_code(code)
            elif user_input.startswith('/debug '):
                problem = user_input[7:]
                result = agent.debug_help(problem)
            else:
                result = agent.chat(user_input, conversation_history)
            
            if result["success"]:
                print(f"\n🤖 {agent.agent_name}: {result['response']}")
                # Ajouter à l'historique
                conversation_history.append({"role": "user", "content": user_input})
                conversation_history.append({"role": "assistant", "content": result['response']})
                # Limiter l'historique à 10 échanges
                if len(conversation_history) > 20:
                    conversation_history = conversation_history[-20:]
            else:
                print(f"\n❌ Erreur: {result['error']}")
                
        except KeyboardInterrupt:
            print("\n👋 Au revoir !")
            break
        except Exception as e:
            print(f"\n❌ Erreur inattendue: {e}")

if __name__ == "__main__":
    main()
