from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action

from django.utils.dateparse import parse_date
from django.db.models import Count

from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from django.db.models.functions import TruncDate

import csv
from django.http import HttpResponse

from .models import Log
from .serializers import LogSerializer
from .filters import LogFilter


class LogViewSet(viewsets.ModelViewSet):

    queryset = Log.objects.all().order_by("-timestamp")
    serializer_class = LogSerializer

    # Enable Search / Filter / Sort
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = LogFilter

    # Search in these fields
    search_fields = ["message", "source"]

    # Sortable fields
    ordering_fields = ["timestamp", "severity", "id"]
    ordering = ["-timestamp"]

    # ==============================
    # LIST (Search + Filter + Sort + Page)
    # ==============================
    def list(self, request, *args, **kwargs):

        try:
            queryset = self.filter_queryset(self.get_queryset())

            page = self.paginate_queryset(queryset)

            if page is not None:
                serializer = self.get_serializer(page, many=True)

                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                    "message": "Logs fetched successfully",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:

            return Response(
                {
                    "success": False,
                    "message": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ==============================
    # CREATE
    # ==============================
    def create(self, request, *args, **kwargs):

        try:
            serializer = self.get_serializer(data=request.data)

            if not serializer.is_valid():

                return Response(
                    {
                        "success": False,
                        "errors": serializer.errors,
                        "message": "Validation failed",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer.save()

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                    "message": "Log created successfully",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception:

            return Response(
                {
                    "success": False,
                    "message": "Internal server error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ==============================
    # RETRIEVE (Detail Page)
    # ==============================
    def retrieve(self, request, *args, **kwargs):

        try:
            log = self.get_object()
            serializer = self.get_serializer(log)

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception:

            return Response(
                {
                    "success": False,
                    "message": "Not found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

    # ==============================
    # UPDATE
    # ==============================
    def update(self, request, *args, **kwargs):

        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)

            if not serializer.is_valid():

                return Response(
                    {
                        "success": False,
                        "errors": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer.save()

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                    "message": "Updated successfully",
                },
                status=status.HTTP_200_OK,
            )

        except Exception:

            return Response(
                {
                    "success": False,
                    "message": "Update failed",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ==============================
    # DELETE
    # ==============================
    def destroy(self, request, *args, **kwargs):

        try:
            instance = self.get_object()
            instance.delete()

            return Response(
                {
                    "success": True,
                    "message": "Deleted successfully",
                },
                status=status.HTTP_200_OK,
            )

        except Exception:

            return Response(
                {
                    "success": False,
                    "message": "Delete failed",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ==============================
    # DASHBOARD: Aggregation
    # ==============================
    @action(detail=False, methods=["get"])
    def aggregate(self, request):

        qs = self.filter_queryset(self.get_queryset())

        data = (
            qs.annotate(date=TruncDate("timestamp"))
            .values("date", "severity", "source")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        return Response(
            {
                "success": True,
                "data": data,
            }
        )

    # ==============================
    # DASHBOARD: Trend Chart
    # ==============================
    @action(detail=False, methods=["get"])
    def trend(self, request):

        qs = self.filter_queryset(self.get_queryset())

        data = (
            qs.annotate(date=TruncDate("timestamp"))
            .values("date", "severity")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        return Response(
            {
                "success": True,
                "data": data,
            }
        )

    @action(detail=False, methods=["get"])
    def histogram(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())

        # Filters
        source = request.query_params.get("source")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if source:
            qs = qs.filter(source=source)
        if start_date:
            qs = qs.filter(timestamp__date__gte=parse_date(start_date))
        if end_date:
            qs = qs.filter(timestamp__date__lte=parse_date(end_date))

        # Aggregate by severity
        data = list(
            qs.values("severity").annotate(count=Count("id"))
        )  # 🔥 convert to list

        severity_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]

        result = [
            {
                "severity": sev,
                "count": next((d["count"] for d in data if d["severity"] == sev), 0),
            }
            for sev in severity_levels
        ]

        return Response({"success": True, "data": result})

    # ==============================
    # CSV EXPORT
    # ==============================
    @action(detail=False, methods=["get"])
    def download(self, request):
        qs = self.filter_queryset(self.get_queryset())

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="logs.csv"'

        writer = csv.writer(response)
        writer.writerow(["id", "timestamp_utc", "severity", "source", "message"])

        for log in qs:
            # Ensure timestamp is in UTC and formatted
            timestamp_utc = log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            writer.writerow(
                [
                    log.id,
                    timestamp_utc,
                    log.severity,
                    log.source,
                    log.message,
                ]
            )

        return response
