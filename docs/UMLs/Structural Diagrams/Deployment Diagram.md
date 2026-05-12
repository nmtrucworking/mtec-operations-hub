# Deployment Diagram

```mermaid
flowchart LR
    Browser[Browser / Frontend App]
    Proxy[Nginx Reverse Proxy]
    API[FastAPI Container]
    DB[(PostgreSQL)]
    AI[Gemini API]

    Browser --> Proxy
    Proxy --> API
    API --> DB
    API --> AI
```

## Mục đích
Mô tả kiến trúc triển khai vật lý của hệ thống trong môi trường production/container.
