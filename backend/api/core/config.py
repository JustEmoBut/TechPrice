from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "techprice"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_debug: bool = True
    cors_origins: list[str] = ["http://localhost:3000"]

    # Scraper
    scraper_delay_min: float = 2.0
    scraper_delay_max: float = 5.0
    scraper_max_products_per_category: int = 200
    scraper_concurrency: int = 2
    scraper_max_retries: int = 3
    scraper_page_timeout: int = 30

    # Scheduler
    scheduler_enabled: bool = True
    scheduler_cron_day: str = "sun"  # Pazar
    scheduler_cron_hour: int = 12
    scheduler_cron_minute: int = 0

    # Logging
    log_level: str = "INFO"


settings = Settings()
