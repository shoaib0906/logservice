import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  Grid,
  IconButton,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";


import { ResponsiveContainer, BarChart, Bar } from "recharts";

dayjs.extend(utc);
dayjs.extend(timezone);

import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ================= API =================
const API = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API,
});

// ================= ErrorBox =================
function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <Paper class="p-2 mb-2 bg-red-100 text-red-900 rounded-xl">
      <Typography variant="subtitle1" fontWeight="bold">
        Error:
      </Typography>
      <ul>
        {Object.entries(error).map(([field, msgs]) => {
          const messages = Array.isArray(msgs) ? msgs : [msgs]; // normalize to array
          return messages.map((m, i) => (
            <li key={`${field}-${i}`}>
              <b>{field}</b>: {m}
            </li>
          ));
        })}
      </ul>
    </Paper>
  );
}

// ================= Layout =================
function Layout({ children }) {
  return (
    <Box className="min-h-screen bg-[#f5f7fb]">
      <Box
        className="flex justify-between items-center bg-gray-800 text-white p-2 px-4"
      >
        <Typography variant="h6">LogService</Typography>
        <Box>
          <Link className="text-white ml-5 no-underline" to="/">
            Logs
          </Link>
          <Link className="text-white ml-5 no-underline" to="/create">
            Create
          </Link>
          <Link className="text-white ml-5 no-underline" to="/dashboard">
            Dashboard
          </Link>
          <Link className="text-white ml-5 no-underline" to="/trend">
            Trend
          </Link>
          <Link className="text-white ml-5 no-underline" to="/histogram">
            Histogram
          </Link>
        </Box>
      </Box>

      <Box
        className="max-w-[1200px] mx-auto my-5 p-3 bg-white rounded shadow"
      >
        {children}
      </Box>
    </Box>
  );
}

function MyDatePicker({ label, value, onChange }) {
  return (
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      renderInput={(params) => <TextField {...params} />}
    />
  );
}


// ================= Logs List =================
function LogsList() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [severity, setSeverity] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/logs/", {
        params: {
          search,
          severity: severity || undefined,
          source: source || undefined,
          start_date: startDate ? startDate.format("YYYY-MM-DD") : undefined,
          end_date: endDate ? endDate.format("YYYY-MM-DD") : undefined,
          page: page + 1,
          page_size: pageSize,
          ordering: "-timestamp",
        },
      });

      setLogs(res.data.results);
      setRowCount(res.data.count || res.data.length);
      setError(null);
    } catch (err) {
      setError({ general: ["Failed to load logs"] });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [severity, source, search, page, pageSize, startDate, endDate]);

  const downloadCSV = () => {
    const params = new URLSearchParams({
      search: search || "",
      severity: severity || "",
      source: source || "",
      start_date: startDate ? startDate.format("YYYY-MM-DD") : "",
      end_date: endDate ? endDate.format("YYYY-MM-DD") : "",
      ordering: "-timestamp",
    });

    window.open(`${API}/api/logs/download/?${params.toString()}`, "_blank");
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "timestamp",
      headerName: "Time",
      width: 200,
      renderCell: (params) =>
        params.value
          ? dayjs.utc(params.value).tz("Asia/Tokyo").format("YYYY-MM-DD HH:mm:ss")
          : "",
    },
    { field: "severity", headerName: "Severity", width: 120 },
    { field: "source", headerName: "Source", width: 150 },
    {
      field: "message",
      headerName: "Message",
      flex: 1,
      renderCell: (params) => <Link to={`/logs/${params.row.id}`}>{params.value}</Link>,
    },
    {
      field: "details",
      headerName: "Details",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Link to={`/logs/${params.row.id}`} className="no-underline">
          <Button variant="contained" size="small" color="primary">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <Layout>
      <Grid container justifyContent="space-between" alignItems="center" className="mb-2">
        <Typography variant="h5">Logs</Typography>
        <Button variant="contained" color="primary" onClick={downloadCSV}>
          ⬇ Download CSV
        </Button>
      </Grid>

      <ErrorBox error={error} />

      {/* Filters */}
      <Grid container spacing={2} className="mb-2">
        <Grid item xs={2}>
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select  value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="DEBUG">DEBUG</MenuItem>
              <MenuItem value="INFO">INFO</MenuItem>
              <MenuItem value="WARNING">WARNING</MenuItem>
              <MenuItem value="ERROR">ERROR</MenuItem>
              <MenuItem value="CRITICAL">CRITICAL</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item>
          <TextField  label="Source" value={source} onChange={(e) => setSource(e.target.value)} />
        </Grid>

        <Grid item>
          <TextField  label="Search Message" value={search} onChange={(e) => setSearch(e.target.value)} />
        </Grid>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid item>
              <MyDatePicker label="Start Date" value={startDate} onChange={setStartDate} />
            </Grid>
            <Grid item>
              <MyDatePicker label="End Date" value={endDate} onChange={setEndDate} />
            </Grid>
        </LocalizationProvider>
      </Grid>

      

      <div className="h-[500px] w-full">
        <DataGrid
          rows={logs}
          columns={columns}
          page={page}
          pageSize={pageSize}
          rowCount={rowCount}
          paginationMode="server"
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => setPageSize(newSize)}
          loading={loading}
        />
      </div>
    </Layout>
  );
}

// ================= Trend Page =================
function TrendPage() {
  const [data, setData] = useState([]);
  const [severity, setSeverity] = useState("");
  const [source, setSource] = useState("");

  const fetchTrend = async () => {
    try {
      const res = await api.get("/api/logs/trend/", {
        params: {
          severity: severity || undefined,
          source: source || undefined,
        },
      });
      setData(res.data.data);
    } catch (err) {
      console.log("Failed to fetch trend:", err);
    }
  };

  useEffect(() => {
    fetchTrend();
  }, [severity, source]);

  return (
    <Layout>
      <Typography variant="h5" className="mb-2">
        Log Trend
      </Typography>

      {/* Filters */}
      <Grid container className="gap-2 mb-2">
        <Grid item xs={2}>
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="DEBUG">DEBUG</MenuItem>
              <MenuItem value="INFO">INFO</MenuItem>
              <MenuItem value="WARNING">WARNING</MenuItem>
              <MenuItem value="ERROR">ERROR</MenuItem>
              <MenuItem value="CRITICAL">CRITICAL</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={2}>
          <TextField
            fullWidth
            label="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            
          />
        </Grid>
      </Grid>

      {/* Chart */}
      <Box className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Layout>
  );
}


// ================= Log Detail =================
function LogDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [log, setLog] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/api/logs/${id}/`).then((r) => setLog(r.data.data));
  }, [id]);

  if (!log) return <Layout>Loading...</Layout>;

  const save = async () => {
    try {
      await api.put(`/api/logs/${id}/`, log);
      alert("Updated");
      setError(null);
    } catch (err) {
      setError(err.response?.data?.errors || { general: ["Update failed"] });
    }
  };

  const del = async () => {
    await api.delete(`/api/logs/${id}/`);
    nav("/");
  };

  return (
    <Layout>
      <Typography variant="h5" className="mb-2">
        Log Detail
      </Typography>
      <ErrorBox error={error} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Message"
            value={log.message}
            onChange={(e) => setLog({ ...log, message: e.target.value })}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select
              value={log.severity}
              onChange={(e) => setLog({ ...log, severity: e.target.value })}
            >
              <MenuItem value="DEBUG">DEBUG</MenuItem>
              <MenuItem value="INFO">INFO</MenuItem>
              <MenuItem value="WARNING">WARNING</MenuItem>
              <MenuItem value="ERROR">ERROR</MenuItem>
              <MenuItem value="CRITICAL">CRITICAL</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Source"
            value={log.source}
            onChange={(e) => setLog({ ...log, source: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} className="flex space-x-2">
          <Button variant="contained" color="primary" onClick={save} className="p-2">
            Save
          </Button>
          <Button variant="contained" color="error" className="ml-2" onClick={del}>
            Delete
          </Button>
        </Grid>
      </Grid>
    </Layout>
  );
}

// ================= Create Log =================
function CreateLog() {
  const nav = useNavigate();
  const [form, setForm] = useState({ message: "", severity: "INFO", source: "" });
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
  
    const newError = {};
  
    if (!form.message) newError.message = ["Message is required"];
    if (!form.severity) newError.severity = ["Severity is required"];
    if (!form.source) newError.source = ["Source is required"];
  
    // If any errors, show them and stop submission
    if (Object.keys(newError).length > 0) {
      setError(newError);
      return;
    }
  
    try {
      await api.post("/api/logs/", form);
      nav("/");
    } catch (err) {
      setError(err.response?.data?.errors || { general: ["Create failed"] });
    }
  };
  

  return (
    <Layout>
      <Typography variant="h5" className="mb-2">
        Create Log
      </Typography>
      <ErrorBox error={error} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
            >
              <MenuItem value="DEBUG">DEBUG</MenuItem>
              <MenuItem value="INFO">INFO</MenuItem>
              <MenuItem value="WARNING">WARNING</MenuItem>
              <MenuItem value="ERROR">ERROR</MenuItem>
              <MenuItem value="CRITICAL">CRITICAL</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Source"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={submit}>
            Create
          </Button>
        </Grid>
      </Grid>
    </Layout>
  );
}

function SeverityHistogram() {
  const [data, setData] = useState([]);
  const [source, setSource] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchHistogram = async () => {
    try {
      const res = await api.get("/api/logs/histogram/", {
        params: {
          source: source || undefined,
          start_date: startDate ? startDate.format("YYYY-MM-DD") : undefined,
          end_date: endDate ? endDate.format("YYYY-MM-DD") : undefined,
        },
      });
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistogram();
  }, [source, startDate, endDate]);

  return (
    <Layout>
      <Typography variant="h5" className="mb-2">
      Severity Histogram
      </Typography>
      <Box className="p-3">
        

        <Grid container spacing={2} className="mb-3">
          <Grid item>
            <TextField label="Source" value={source} onChange={(e) => setSource(e.target.value)} />
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid item>
              <MyDatePicker label="Start Date" value={startDate} onChange={setStartDate} />
            </Grid>
            <Grid item>
              <MyDatePicker label="End Date" value={endDate} onChange={setEndDate} />
            </Grid>
          </LocalizationProvider>
        </Grid>

        <Box className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="severity" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Layout>
  );
}


// ================= Dashboard =================
function Dashboard() {
  const [data, setData] = useState([]);
  const [severityFilter, setSeverityFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchTrend = async () => {
    try {
      const res = await api.get("/api/logs/trend/", {
        params: {
          severity: severityFilter || undefined,
          source: sourceFilter || undefined,
          start_date: startDate ? startDate.format("YYYY-MM-DD") : undefined,
          end_date: endDate ? endDate.format("YYYY-MM-DD") : undefined,
        },
      });

      // Transform data to group by date
      const grouped = {};
      res.data.data.forEach((item) => {
        if (!grouped[item.date]) grouped[item.date] = {};
        grouped[item.date][item.severity] = item.count;
      });

      // Convert to array for Recharts
      const chartData = Object.keys(grouped)
        .sort()
        .map((date) => ({
          date,
          ...grouped[date],
        }));

      setData(chartData);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTrend();
  }, [severityFilter, sourceFilter, startDate, endDate]);

  const severityLevels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];
  const colors = {
    DEBUG: "#6b7280",
    INFO: "#2563eb",
    WARNING: "#facc15",
    ERROR: "#ef4444",
    CRITICAL: "#7c2d12",
  };

  return (
    <Layout>
      <Typography variant="h5" className="mb-2">
        Dashboard
      </Typography>

      <Grid container spacing={2} className="mb-3">
        <Grid item xs={2}>
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {severityLevels.map((sev) => (
                <MenuItem key={sev} value={sev}>
                  {sev}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item>
          <TextField
            label="Source"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          />
        </Grid>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid item>
            <MyDatePicker label="Start Date" value={startDate} onChange={setStartDate} />
          </Grid>
          <Grid item>
            <MyDatePicker label="End Date" value={endDate} onChange={setEndDate} />
          </Grid>
        </LocalizationProvider>
      </Grid>

      <Box className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            {severityLevels.map((sev) => (
              <Line
                key={sev}
                dataKey={sev}
                stroke={colors[sev]}
                strokeWidth={2}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Layout>
  );
}


// ================= App =================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LogsList />} />
        <Route path="/logs/:id" element={<LogDetail />} />
        <Route path="/create" element={<CreateLog />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trend" element={<TrendPage />} />
        <Route path="/histogram" element={<SeverityHistogram />} />
        
      </Routes>
    </BrowserRouter>
  );
}
