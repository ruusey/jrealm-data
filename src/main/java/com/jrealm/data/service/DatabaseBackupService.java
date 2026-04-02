package com.jrealm.data.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DatabaseBackupService {

    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public DatabaseBackupService(final MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    public File exportDatabase(String outputPath) {
        if (outputPath == null || outputPath.isEmpty()) {
            final String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
            outputPath = "jrealm-backup-" + timestamp + ".json";
        }

        final File outputFile = new File(outputPath);
        final Set<String> collectionNames = this.mongoTemplate.getCollectionNames();

        log.info("Starting full database backup of {} collections to {}", collectionNames.size(), outputFile.getAbsolutePath());

        final Map<String, List<Document>> backup = new LinkedHashMap<>();

        for (String collectionName : collectionNames) {
            final List<Document> documents = this.mongoTemplate.findAll(Document.class, collectionName);
            backup.put(collectionName, documents);
            log.info("  Exported {} documents from collection '{}'", documents.size(), collectionName);
        }

        try (FileOutputStream fos = new FileOutputStream(outputFile)) {
            final String json = this.objectMapper.writeValueAsString(backup);
            fos.write(json.getBytes());
            log.info("Database backup completed successfully: {}", outputFile.getAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to write backup file. Reason: {}", e.getMessage(), e);
            throw new RuntimeException("Backup failed", e);
        }

        return outputFile;
    }

    public void importDatabase(String inputPath) {
        final File inputFile = new File(inputPath);
        if (!inputFile.exists()) {
            throw new RuntimeException("Backup file not found: " + inputFile.getAbsolutePath());
        }

        log.info("Starting full database restore from {}", inputFile.getAbsolutePath());

        final Map<String, List<Map<String, Object>>> backup;
        try (FileInputStream fis = new FileInputStream(inputFile)) {
            final String content = new String(fis.readAllBytes());
            backup = this.objectMapper.readValue(content, new TypeReference<Map<String, List<Map<String, Object>>>>() {});
        } catch (Exception e) {
            log.error("Failed to read backup file. Reason: {}", e.getMessage(), e);
            throw new RuntimeException("Restore failed", e);
        }

        for (Map.Entry<String, List<Map<String, Object>>> entry : backup.entrySet()) {
            final String collectionName = entry.getKey();
            final List<Map<String, Object>> documents = entry.getValue();

            this.mongoTemplate.dropCollection(collectionName);
            log.info("  Dropped collection '{}'", collectionName);

            if (!documents.isEmpty()) {
                final List<Document> bsonDocs = new ArrayList<>();
                for (Map<String, Object> doc : documents) {
                    bsonDocs.add(new Document(doc));
                }
                this.mongoTemplate.getCollection(collectionName).insertMany(bsonDocs);
                log.info("  Restored {} documents to collection '{}'", bsonDocs.size(), collectionName);
            }
        }

        log.info("Database restore completed successfully from {}", inputFile.getAbsolutePath());
    }
}
