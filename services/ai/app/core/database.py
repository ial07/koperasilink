from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, future=True)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    """Dependency that provides a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
