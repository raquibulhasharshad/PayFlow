package com.payflow.notification.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.io.IOException;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {

    // Emitters by username
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@RequestParam String username) {
        String key = username.trim().toLowerCase();
        SseEmitter emitter = new SseEmitter(24 * 60 * 60 * 1000L); // 24 hour timeout
        
        emitters.put(key, emitter);

        emitter.onCompletion(() -> emitters.remove(key));
        emitter.onTimeout(() -> emitters.remove(key));
        emitter.onError((e) -> emitters.remove(key));

        // Send initialization message
        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected successfully"));
        } catch (IOException e) {
            emitters.remove(key);
        }

        return emitter;
    }

    public void sendNotification(String username, String title, String message, String type) {
        String key = username.trim().toLowerCase();
        SseEmitter emitter = emitters.get(key);
        if (emitter != null) {
            try {
                Map<String, String> data = Map.of(
                    "title", title,
                    "message", message,
                    "type", type,
                    "timestamp", String.valueOf(System.currentTimeMillis())
                );
                emitter.send(SseEmitter.event().name("NOTIFICATION").data(data));
            } catch (IOException e) {
                emitters.remove(key);
            }
        }
    }
}
