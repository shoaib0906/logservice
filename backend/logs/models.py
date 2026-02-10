
from django.db import models

class Log(models.Model):

    SEVERITY_CHOICES = [
        ('DEBUG','Debug'),
        ('INFO','Info'),
        ('WARNING','Warning'),
        ('ERROR','Error'),
        ('CRITICAL','Critical'),
    ]

    timestamp = models.DateTimeField(auto_now_add=True)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    source = models.CharField(max_length=100)
