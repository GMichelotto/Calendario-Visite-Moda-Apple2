import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';
import EventModal from './EventModal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useDatabase } from './hooks/useDatabase';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Button
} from '@mui/material';
import { 
  Menu as MenuIcon,
  People as PeopleIcon,
  Collections as CollectionsIcon,
  Event as EventIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { itIT } from '@mui/material/locale';

moment.locale('it');
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
}, itIT);

function App() {
  const [events, setEvents] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [collezioni, setCollezioni] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [openDrawer, setOpenDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getClienti, getCollezioni, getEventi, isLoading, error } = useDatabase();

  useEffect(() => {
    console.log('Clienti:', clienti);
    console.log('Collezioni:', collezioni);
    console.log('Eventi:', events);
  }, [clienti, collezioni, events]);

  useEffect(() => {
    if (events.length > 0) {
      const firstEventStart = moment(events[0].start);
      setCalendarDate(firstEventStart.toDate());
    }
  }, [events]);

  const processCSV = (text, fileType) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      throw new Error("Il file CSV deve contenere almeno un'intestazione e una riga di dati.");
    }

    const [headers, ...rows] = lines.map(row => {
      const matches = row.match(/(".*?"|[^";]+)(?=\s*;|\s*$)/g) || [];
      return matches.map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
    });

    return rows.map(row => {
      if (row.length !== headers.length) {
        console.warn(`Riga con numero di colonne non corrispondente all'intestazione: ${row}`);
      }
      const obj = {};
      headers.forEach((header, index) => {
        if (fileType === 'clienti' && header === 'collezioni') {
          obj[header] = row[index] ? row[index].split(';').map(c => c.trim()) : [];
        } else {
          obj[header] = row[index] || '';
        }
      });
      return obj;
    });
  };

  const handleFileUpload = async (event, fileType) => {
    try {
      const file = event.target.files[0];
      console.log(`Caricamento file ${fileType}:`, file.name);
      
      const text = await file.text();
      console.log(`Contenuto del file ${fileType}:`, text.substring(0, 200) + '...');
      
      const data = processCSV(text, fileType);
      
      if (fileType === 'clienti') {
        setClienti(data);
        console.log("Clienti caricati:", data);
      } else if (fileType === 'collezioni') {
        setCollezioni(data);
        console.log("Collezioni caricate:", data);
      }
      
      setMessage(`${fileType} caricati: ${data.length}`);
    } catch (error) {
      setMessage(`Errore nel caricamento del file ${fileType}: ${error.message}`);
      console.error(`Errore nel caricamento del file ${fileType}:`, error);
    }
  };

  const generateEvents = () => {
    console.log('Inizio generazione eventi');
    setMessage('Inizio generazione eventi...');
    if (clienti.length === 0 || collezioni.length === 0) {
      setMessage('Carica entrambi i file CSV prima di generare gli eventi.');
      return;
    }

    const newEvents = [];
    const collectionDates = {};

    collezioni.forEach((collezione) => {
      const startDate = moment(collezione['Data Inizio'], 'DD/MM/YYYY');
      const endDate = moment(collezione['Data Fine'], 'DD/MM/YYYY');
      if (!startDate.isValid() || !endDate.isValid()) {
        console.error(`Date non valide per la collezione: ${collezione.Collezioni}`);
        return;
      }
      collectionDates[collezione.Collezioni] = { start: startDate, end: endDate };
    });

    const findNextAvailableSlot = (date, events) => {
      const workingHours = [
        { start: 9, end: 13 },
        { start: 14, end: 18 }
      ];
      
      while (true) {
        if (date.day() === 0 || date.day() === 6) {
          date.add(1, 'days').hour(9).minute(0);
          continue;
        }

        for (const hours of workingHours) {
          date.hour(hours.start).minute(0);
          const endTime = moment(date).add(2, 'hours');

          if (endTime.hour() > hours.end) {
            continue;
          }

          const overlap = events.some(event => 
            (moment(event.start).isBefore(endTime) && moment(event.end).isAfter(date))
          );

          if (!overlap) {
            return date;
          }
        }

        date.add(1, 'days').hour(9).minute(0);
      }
    };

    clienti.forEach((cliente) => {
      cliente.collezioni.forEach((collection) => {
        const dateRange = collectionDates[collection];
        if (!dateRange) {
          console.error(`Date non trovate per la collezione: ${collection}`);
          return;
        }
        
        let eventDate = moment(dateRange.start);
        eventDate = findNextAvailableSlot(eventDate, newEvents);
        
        if (eventDate.isAfter(dateRange.end)) {
          console.warn(`Non è possibile programmare un evento per ${cliente.Nome} - ${collection}`);
          return;
        }

        const eventEnd = moment(eventDate).add(2, 'hours');

        const newEvent = {
          id: `${cliente.Nome}-${collection}-${eventDate.format()}`,
          title: `${cliente.Nome} - ${collection}`,
          start: eventDate.toDate(),
          end: eventEnd.toDate(),
          cliente: cliente.Nome,
          collezione: collection
        };

        newEvents.push(newEvent);
      });
    });

    setEvents(newEvents);
    setMessage(`Eventi generati: ${newEvents.length}`);
  };

  const handleSaveCalendar = () => {
    const dataStr = JSON.stringify(events);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'calendar_events.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setMessage('Calendario salvato con successo');
  };

  const handleLoadCalendar = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedEvents = JSON.parse(e.target.result);
        setEvents(loadedEvents.map(ev => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end)
        })));
        setMessage('Calendario caricato con successo');
      } catch (error) {
        setMessage(`Errore nel caricamento del calendario: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const onEventDrop = useCallback(({ event, start, end }) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(ev => 
        ev.id === event.id ? { ...ev, start, end } : ev
      );
      return updatedEvents;
    });
    setMessage(`Evento "${event.title}" spostato con successo`);
  }, []);

  const onEventResize = useCallback(({ event, start, end }) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(ev => 
        ev.id === event.id ? { ...ev, start, end } : ev
      );
      return updatedEvents;
    });
    setMessage(`Evento "${event.title}" ridimensionato con successo`);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleUpdateEvent = (updatedEvent) => {
    setEvents(prevEvents => 
      prevEvents.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev)
    );
    setSelectedEvent(null);
    setMessage('Evento aggiornato con successo');
  };

  if (isLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setOpenDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Fashion Calendar
            </Typography>
          </Toolbar>
        </AppBar>

        <Drawer anchor="left" open={openDrawer} onClose={() => setOpenDrawer(false)}>
          <List sx={{ width: 250 }}>
            <ListItem button>
              <ListItemIcon><PeopleIcon /></ListItemIcon>
              <ListItemText primary="Clienti" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><CollectionsIcon /></ListItemIcon>
              <ListItemText primary="Collezioni" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><EventIcon /></ListItemIcon>
              <ListItemText primary="Eventi" />
            </ListItem>
          </List>
        </Drawer>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            {/* File Upload Section */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => handleFileUpload(e, 'clienti')} 
                  id="clienti-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="clienti-upload">
                  <Button
                    component="span"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                  >
                    Carica CSV Clienti
                  </Button>
                </label>

                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => handleFileUpload(e, 'collezioni')} 
                  id="collezioni-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="collezioni-upload">
                  <Button
                    component="span"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                  >
                    Carica CSV Collezioni
                  </Button>
                </label>

                <Button
                  variant="contained"
                  onClick={generateEvents}
                  startIcon={<EventIcon />}
                >
                  Genera Eventi
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSaveCalendar}
                  startIcon={<SaveIcon />}
                >
                  Salva Calendario
                </Button>

                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleLoadCalendar} 
                  id="load-calendar"
                  style={{ display: 'none' }}
                />
                <label htmlFor="load-calendar">
                  <Button
                    component="span"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                  >
                    Carica Calendario
                  </Button>
                </label>
              </Paper>
            </Grid>

            {/* Summary Cards */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Typography variant="h6" gutterBottom>
                  Clienti Totali
                </Typography>
                <Typography variant="h3" component="div">
                  {clienti.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Typography variant="h6" gutterBottom>
                  Collezioni Attive
                </Typography>
                <Typography variant="h3" component="div">
                  {collezioni.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Typography variant="h6" gutterBottom>
                  Eventi Totali
                </Typography>
                <Typography variant="h3" component="div">
                  {events.length}
