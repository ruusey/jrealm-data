FROM maven:3.8.6-openjdk-11-slim as BUILD
WORKDIR /app
RUN cd ..
COPY ./jrealm-data ./jrealm-data
COPY ./jrealm ./jrealm-server

RUN mvn clean install -f ./jrealm-server/pom.xml
RUN mvn clean package -f ./jrealm-data/pom.xml

FROM openjdk:11-jre-slim-bullseye

COPY --from=BUILD /app/jrealm-data/target/jrealm-data.jar /jrealm-data.jar
EXPOSE 8085
ENTRYPOINT [ "java", "-jar", "jrealm-data.jar" ]
