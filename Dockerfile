FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Install jrealm dependency into local Maven repo
COPY ./jrealm ./jrealm
RUN mvn -B clean install -DskipTests -f ./jrealm/pom.xml

# Build jrealm-data
COPY ./jrealm-data ./jrealm-data
RUN mvn -B clean package -DskipTests -f ./jrealm-data/pom.xml

FROM eclipse-temurin:17-jre
COPY --from=build /app/jrealm-data/target/jrealm-data.jar /jrealm-data.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "jrealm-data.jar"]
