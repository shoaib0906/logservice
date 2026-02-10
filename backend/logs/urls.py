
from rest_framework.routers import DefaultRouter
from .views import LogViewSet

router = DefaultRouter()
router.register('logs', LogViewSet)

urlpatterns = router.urls
