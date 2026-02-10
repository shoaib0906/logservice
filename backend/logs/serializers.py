from rest_framework import serializers
from django.utils import timezone
from .models import Log
from datetime import timezone as dt_timezone, timedelta

JST = dt_timezone(timedelta(hours=9))


class LogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Log
        fields = "__all__"

    def get_timestamp(self, obj):
        # obj.timestamp is UTC-aware
        return obj.timestamp.astimezone(JST).strftime("%Y-%m-%d %H:%M:%S %z")
