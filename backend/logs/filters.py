import django_filters
from .models import Log


class LogFilter(django_filters.FilterSet):
    start_date = django_filters.DateFilter(
        field_name="timestamp",
        lookup_expr="date__gte",
    )
    end_date = django_filters.DateFilter(
        field_name="timestamp",
        lookup_expr="date__lte",
    )

    class Meta:
        model = Log
        fields = ["severity", "source", "start_date", "end_date"]
