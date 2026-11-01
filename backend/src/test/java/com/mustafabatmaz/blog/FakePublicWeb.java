package com.mustafabatmaz.blog;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.jspecify.annotations.Nullable;

/**
 * Stands in for public-web in every integration test: records the revalidation requests the backend sends.
 * One server for the whole test run, so all test classes keep sharing one cached application context.
 */
public final class FakePublicWeb {

    public static final String SECRET = "test-only-revalidate-secret";

    /** upgrade: Java's HttpClient asks for HTTP/2 by default, which Next's Node server answers with nothing */
    public record Received(
            String method,
            String path,
            @Nullable String authorization,
            @Nullable String upgrade) {}

    private static final BlockingQueue<Received> RECEIVED = new LinkedBlockingQueue<>();
    private static volatile int status = 204;
    private static final HttpServer SERVER = start();

    private FakePublicWeb() {}

    public static String url() {
        return "http://127.0.0.1:" + SERVER.getAddress().getPort();
    }

    public static void reset() {
        RECEIVED.clear();
        status = 204;
    }

    public static void answerWith(int statusCode) {
        status = statusCode;
    }

    /** The next request, waiting a little because the backend sends it in the background. */
    public static @Nullable Received next(long millis) throws InterruptedException {
        return RECEIVED.poll(millis, TimeUnit.MILLISECONDS);
    }

    private static HttpServer start() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            server.createContext("/", exchange -> {
                RECEIVED.add(new Received(
                        exchange.getRequestMethod(),
                        exchange.getRequestURI().getPath(),
                        exchange.getRequestHeaders().getFirst("Authorization"),
                        exchange.getRequestHeaders().getFirst("Upgrade")));
                exchange.sendResponseHeaders(status, -1);
                exchange.close();
            });
            server.start();
            return server;
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }
}
