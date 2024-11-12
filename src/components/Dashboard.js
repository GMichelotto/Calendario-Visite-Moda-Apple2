import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/it';
import { useDatabase } from '../hooks/useDatabase';
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
  Alert
} from '@mui/material';
import { 
  Menu as MenuIcon,
  People as PeopleIcon,
  Collections as CollectionsIcon,
  Event as EventIcon,
  Upload as UploadIcon
} from '@mui/icons-material';

moment.locale('it');
const localizer = momentLocalizer(moment);

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [collezioni, setCollezioni] = useState([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [error, setError] = useState(null);
  const { getEventi, getClienti, getCollezioni, isLoading } = useDatabase();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventiData, clientiData, collezioniData] = await Promise.all([
          getEventi(),
          getClienti(),
          getCollezioni()
        ]);
        
        setEvents(eventiData.map(evento => ({
          ...evento,
          start: new Date(evento.data_inizio),
          end: new Date(evento.data_fine),
          title: `${evento.cliente} - ${evento.collezione}`
        })));
        setClienti(clientiData);
        setCollezioni(collezioniData);
      } catch (err) {
        setError(err.message);
      }
    };

    loadData();
  }, [getEventi, getClienti, getCollezioni]);

  const handleFileUpload = (type) => {
    // Implementazione caricamento file
    console.log(`Uploading ${type} file...`);
  };

  const summaryData = {
    clientiTotali: clienti.length,
    collezioniAttive: collezioni.filter(c => 
      moment(c.data_chiusura).isAfter(moment())
    ).length,
    eventiProssimi: events.filter(e => 
      moment(e.start).isAfter(moment())
    ).length
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
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
          <ListItem button onClick={() => handleFileUpload('csv')}>
            <ListItemIcon><UploadIcon /></ListItemIcon>
            <ListItemText primary="Importa CSV" />
          </ListItem>
        </List>
      </Drawer>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" gutterBottom>
                Clienti Totali
              </Typography>
              <Typography variant="h3" component="div">
                {summaryData.clientiTotali}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" gutterBottom>
                Collezioni Attive
              </Typography>
              <Typography variant="h3" component="div">
                {summaryData.collezioniAttive}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" gutterBottom>
                Eventi Prossimi
              </Typography>
              <Typography variant="h3" component="div">
                {summaryData.eventiProssimi}
              </Typography>
            </Paper>
          </Grid>

          {/* Calendar */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 640 }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                messages={{
                  next: "Successivo",
                  previous: "Precedente",
                  today: "Oggi",
                  month: "Mese",
                  week: "Settimana",
                  day: "Giorno"
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
