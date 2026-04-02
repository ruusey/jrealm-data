FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Install openrealm dependency into local Maven repo
COPY ./openrealm ./openrealm
RUN mvn -B clean install -DskipTests -f ./openrealm/pom.xml

# Build openrealm-data
COPY ./openrealm-data ./openrealm-data
RUN mvn -B clean package -DskipTests -f ./openrealm-data/pom.xml

FROM eclipse-temurin:17-jre
COPY --from=build /app/openrealm-data/target/openrealm-data.jar /openrealm-data.jar
EXPOSE 80
ENTRYPOINT ["java", "-jar", "openrealm-data.jar"]
