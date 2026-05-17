package com.elearning.xmpp;

import org.jivesoftware.smack.ConnectionConfiguration;
import org.jivesoftware.smack.SmackException;
import org.jivesoftware.smack.XMPPException;
import org.jivesoftware.smack.chat2.Chat;
import org.jivesoftware.smack.chat2.ChatManager;
import org.jivesoftware.smack.tcp.XMPPTCPConnection;
import org.jivesoftware.smack.tcp.XMPPTCPConnectionConfiguration;
import org.jxmpp.jid.impl.JidCreate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.function.Consumer;

/**
 * XMPPService — connects to an XMPP server using the Smack library.
 *
 * This demonstrates the XMPP protocol concepts:
 * - Connect to XMPP server (e.g. OpenFire on localhost)
 * - Authenticate with username + password
 * - Send instant messages to other XMPP users
 * - Listen for incoming messages
 *
 * In this project, real-time chat uses WebSocket/STOMP (ChatController).
 * This service shows how XMPP would work with a real XMPP server.
 *
 * To use with OpenFire:
 * 1. Install OpenFire from https://www.igniterealtime.org/projects/openfire/
 * 2. Create user accounts in OpenFire admin panel
 * 3. Update the config below with your server details
 */
@Service
public class XMPPService {

    private XMPPTCPConnection connection;

    // XMPP server configuration — change these to your OpenFire settings
    private static final String XMPP_HOST     = "localhost";
    private static final int    XMPP_PORT     = 5222;
    private static final String XMPP_DOMAIN   = "localhost";

    /**
     * Connect and authenticate to the XMPP server.
     *
     * @param username  XMPP username (e.g. "teacher1")
     * @param password  XMPP password
     */
    public void connect(String username, String password) throws XMPPException, SmackException, IOException, InterruptedException {
        XMPPTCPConnectionConfiguration config = XMPPTCPConnectionConfiguration.builder()
            .setHost(XMPP_HOST)
            .setPort(XMPP_PORT)
            .setXmppDomain(XMPP_DOMAIN)
            .setSecurityMode(ConnectionConfiguration.SecurityMode.disabled)
            .build();

        connection = new XMPPTCPConnection(config);
        connection.connect();
        connection.login(username, password);

        System.out.println("XMPP: Connected as " + username + "@" + XMPP_DOMAIN);
    }

    /**
     * Send a direct message to another XMPP user.
     *
     * @param toUsername   Recipient's XMPP username
     * @param messageText  The message content
     */
    public void sendMessage(String toUsername, String messageText) throws Exception {
        if (connection == null || !connection.isConnected()) {
            throw new IllegalStateException("XMPP: Not connected. Call connect() first.");
        }

        ChatManager chatManager = ChatManager.getInstanceFor(connection);
        Chat chat = chatManager.chatWith(JidCreate.entityBareFrom(toUsername + "@" + XMPP_DOMAIN));
        chat.send(messageText);

        System.out.println("XMPP: Message sent to " + toUsername + ": " + messageText);
    }

    /**
     * Register a listener for incoming messages.
     *
     * @param onMessage  Callback called with the sender JID and message body
     */
    public void onMessageReceived(Consumer<String> onMessage) {
        if (connection == null) return;

        ChatManager chatManager = ChatManager.getInstanceFor(connection);
        chatManager.addIncomingListener((from, message, chat) -> {
            String text = message.getBody();
            if (text != null) {
                onMessage.accept("[" + from + "]: " + text);
            }
        });
    }

    /**
     * Disconnect from the XMPP server.
     */
    public void disconnect() {
        if (connection != null && connection.isConnected()) {
            connection.disconnect();
            System.out.println("XMPP: Disconnected.");
        }
    }

    /**
     * Check if connected to XMPP server.
     */
    public boolean isConnected() {
        return connection != null && connection.isConnected();
    }
}
