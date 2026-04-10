package com.openrealm.data;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.openrealm.data.service.DatabaseBackupService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class DatabaseBackupRunner implements ApplicationRunner {

    private final DatabaseBackupService backupService;

    @Autowired
    public DatabaseBackupRunner(final DatabaseBackupService backupService) {
        this.backupService = backupService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        boolean performed = false;

        if (args.containsOption("backup")) {
            final var values = args.getOptionValues("backup");
            final String outputPath = (values != null && !values.isEmpty()) ? values.get(0) : null;
            this.backupService.exportDatabase(outputPath);
            performed = true;
        }

        if (args.containsOption("restore")) {
            final var values = args.getOptionValues("restore");
            if (values == null || values.isEmpty()) {
                log.error("--restore requires a file path argument, e.g. --restore=openrealm-backup-2026-04-02.json");
                System.exit(1);
                return;
            }
            this.backupService.importDatabase(values.get(0));
            performed = true;
        }

        if (performed) {
            log.info("Backup/restore operation complete. Shutting down.");
            System.exit(0);
        }
    }
}
