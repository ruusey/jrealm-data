package com.jrealm.data.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebClientRedirectController {

    @GetMapping("/game-data/webclient")
    public String redirectToWebClient() {
        return "redirect:/game-data/webclient/index.html";
    }

    @GetMapping("/game-data/webclient/")
    public String redirectToWebClientSlash() {
        return "redirect:/game-data/webclient/index.html";
    }
}
