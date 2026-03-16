package com.fitsphere.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/social")
public class SocialController {

    @GetMapping("/feed")
    public ResponseEntity<List<Map<String, String>>> getFeed() {
        var feed = List.of(
            Map.of(
                "user", "@mara.moves",
                "title", "Completed leg day",
                "content", "Squat 120kg x 5, Deadlift 160kg x 3"
            ),
            Map.of(
                "user", "@stridebykai",
                "title", "Morning tempo run",
                "content", "12.4km at 4:12/km pace"
            )
        );

        return ResponseEntity.ok(feed);
    }
}
