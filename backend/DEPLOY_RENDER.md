# Deploy в Render

## Что уже подготовлено

- Добавлен `render.yaml` (Blueprint) для автоматического создания:
  - PostgreSQL базы (`iipoll-db`)
  - Web-сервиса (`iipoll-api`)
- Приложение читает порт Render через `PORT`
- Подключение к PostgreSQL настраивается через `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`
- Сборка и запуск:
  - `mvn -DskipTests clean package`
  - `java -jar target/iipoll-1.0-SNAPSHOT.jar`

## Как задеплоить

1. Запушить проект в GitHub/GitLab.
2. В Render выбрать **New + Blueprint**.
3. Указать репозиторий с проектом.
4. Render подхватит `render.yaml` и создаст сервис + базу.
5. Дождаться статуса **Live**.

## Проверка после деплоя

- Swagger UI: `https://<your-service>.onrender.com/swagger-ui.html`
- OpenAPI JSON: `https://<your-service>.onrender.com/v3/api-docs`
- OpenAPI YAML: `https://<your-service>.onrender.com/v3/api-docs.yaml`

## Примечания

- На Free-плане Render сервис может "засыпать" при простое.
- Если поменяете `artifactId` или `version`, обновите `startCommand` в `render.yaml`.
