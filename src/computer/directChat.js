import Contact from "./contact.js"
import Chat from "./chat.js"

export default class DirectChat {
    constructor(socialMediaScreen, x, y, pfp, username, feedDims, dmZoneDims) {

        this.scene = socialMediaScreen.scene

        this.currNode = null

        this.chat = new Chat(socialMediaScreen, x, y, pfp, username, feedDims[0], feedDims[1], () => {
            // Si es un mensaje de chat, lo procesa
            if (this.currNode.type === "chatMessage") {
                this.processNode();
            }
            // Si no, lo procesa el dialogManager
            else {
                this.scene.dialogManager.setNode(this.currNode, []);
                this.currNode = null
            }
        })
        
        this.contact = new Contact(socialMediaScreen, pfp, username, dmZoneDims[0], dmZoneDims[1], () => {
            socialMediaScreen.setFeedAndPostsVisible(false)
            socialMediaScreen.setChatsVisible(false)
            this.setChatVisible(true)
            this.contact.clearNotifications()
        })

        this.setChatVisible(false)
    }

    addMessage(text, character, name) {
        if(!this.chat.visible) {
            if (character != "player") {
                this.contact.addNotification()
            }
            else {
                this.contact.clearNotifications()
            }
        }
        this.chat.addMessage(text, character, name)
    }

    setChatVisible(enable) {
        this.chat.setVisible(enable)
    }

    setChatNode(node) {
        this.currNode = node
        this.processNode()
    }

    processNode() {
        if (this.currNode) {
            let delay = 0;
            if (this.currNode.nextDelay == null) {
                delay = this.currNode.nextDelay;
            }

            if (this.currNode.type === "chatMessage") {
                setTimeout(() => {
                    this.addMessage(this.currNode.text, this.currNode.character, this.currNode.name);
                    this.currNode = this.currNode.next[0];
                    this.processNextNode(delay);
                }, this.currNode.replyDelay);

            }
            // Si el nodo es de tipo condicion, hace que el dialogManager lo procese y obtiene el siguiente nodo
            else if (this.currNode.type === "condition") {
                let i = this.scene.dialogManager.processConditionNode(this.currNode);
                this.scene.dialogManager.currNode = this.currNode;

                // El indice del siguiente nodo sera el primero que cumpla una de las condiciones
                this.currNode = this.currNode.next[i];

                // Pasa al siguiente nodo
                this.processNextNode(delay);
            }
            // Si el nodo es de tipo evento, hace que el dialogManager lo procese y pasa al siguiente nodo
            else if (this.currNode.type === "event") {
                this.scene.dialogManager.processEventNode(this.currNode);

                // IMPORTANTE: DESPUES DE UN NODO DE EVENTO SOLO HAY UN NODO, POR LO QUE 
                // EL SIGUIENTE NODO SERA EL PRIMER NODO DEL ARRAY DE NODOS SIGUIENTES
                this.currNode = this.currNode.next[0];
                this.processNextNode(delay);
            }
            else if (this.currNode.type === "text") {
                this.scene.dialogManager.currNode = this.currNode;
                this.chat.restartChatAnim()
                this.scene.dialogManager.disableInteraction();
            }
            else {
                this.chat.restartChatAnim()
                this.scene.dialogManager.disableInteraction();
            }
        }
        else {
            this.scene.dialogManager.disableInteraction();
        }
    }

    processNextNode(delay) {
        setTimeout(() => {
            this.processNode();
        }, delay);
    }
}