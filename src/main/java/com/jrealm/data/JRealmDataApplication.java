package com.jrealm.data;

import java.io.DataOutputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.jrealm.game.data.GameDataManager;
import com.jrealm.game.util.WorkerThread;
import com.jrealm.net.Packet;
import com.jrealm.net.client.SocketClient;
import com.jrealm.net.core.IOService;
import com.jrealm.net.server.ProcessingThread;
import com.jrealm.net.server.SocketServer;
import com.jrealm.net.server.packet.TextPacket;

@SpringBootApplication
public class JRealmDataApplication {

	public static void main(String[] args) throws Exception {
		GameDataManager.loadGameData(false);
		SpringApplication.run(JRealmDataApplication.class, args);
		//networkingDemo();

	}

	private static void networkingDemo() throws Exception {
		final SocketServer server = new SocketServer(2222);
		// Run message server in its own thread
		WorkerThread.submitAndForkRun(server);

		final SocketClient client = new SocketClient("127.0.0.1", 2222);
		// Run client in its own thread
		WorkerThread.submitAndForkRun(client);

		// Dummy message data
		final TextPacket demoPacket = TextPacket.from("ruusey@gmail.com", "SYSTEM", "Test text packet");

		// Dequeue messages from all clients
		final Runnable serverDequeue = () -> {
			try {
				long start = Instant.now().toEpochMilli();
				long count = 0;
				while (true) {
					List<Packet> dequeue = new ArrayList<>();
					for (ProcessingThread thread : server.getClients().values()) {
						while (!thread.getPacketQueue().isEmpty()) {
							dequeue.add(thread.getPacketQueue().remove());
							count++;
						}
						demoPacket.serializeWrite(new DataOutputStream(thread.getClientSocket().getOutputStream()));
					}

					// Count messages per second
					if (Instant.now().toEpochMilli() - start >= 1000) {
						System.out.println("[SERVER] Throughput =" + count + " messages/second");
						count = 0;
						start = Instant.now().toEpochMilli();
					}
				}

			} catch (Exception e) {
			}
		};
		// Start dequeuing work on server side
		WorkerThread.submitAndForkRun(serverDequeue);
		
		// Start dequeuing work on the client side
		long start = Instant.now().toEpochMilli();
		long count = 0;
		while (true) {
			client.sendRemote(demoPacket);
			List<Packet> dequeue = new ArrayList<>();

			while (!client.getInboundPacketQueue().isEmpty()) {
				dequeue.add(client.getInboundPacketQueue().remove());
				count++;
			}
			if (Instant.now().toEpochMilli() - start >= 1000) {
				System.out.println("[CLIENT] Throughput =" + count + " messages/second");
				count = 0;
				start = Instant.now().toEpochMilli();
			}
		}
	}
}
