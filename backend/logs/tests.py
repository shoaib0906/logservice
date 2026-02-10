from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from logs.models import Log


class LogViewSetTests(APITestCase):

    def setUp(self):
        self.log1 = Log.objects.create(
            message="Test log 1",
            severity="INFO",
            source="auth",
            timestamp=timezone.now(),
        )
        self.log2 = Log.objects.create(
            message="Test log 2",
            severity="ERROR",
            source="api",
            timestamp=timezone.now(),
        )

    def test_list_logs(self):
        url = reverse("log-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["results"] or response.data["data"])

    def test_create_log(self):
        url = reverse("log-list")
        payload = {
            "message": "New log",
            "severity": "DEBUG",
            "source": "system",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Log.objects.count(), 3)

    def test_aggregate_api(self):
        url = reverse("log-aggregate")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("data" in response.data)

    def test_trend_api(self):
        url = reverse("log-trend")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("data" in response.data)

    def test_histogram_api(self):
        url = reverse("log-histogram")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        severities = [item["severity"] for item in response.data["data"]]
        self.assertIn("INFO", severities)
        self.assertIn("ERROR", severities)

    def test_csv_download(self):
        url = reverse("log-download")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")
