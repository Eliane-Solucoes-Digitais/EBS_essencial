import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

/* =========================================
   1. CONFIGURAÇÃO FIREBASE
========================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBg5gMODOjb0uTlBXu_sZ-V2X-xLLQfo3",
  authDomain: "ebs-beauty-essencial-dev.firebaseapp.com",
  projectId: "ebs-beauty-essencial-dev",
  storageBucket: "ebs-beauty-essencial-dev.firebasestorage.app",
  messagingSenderId: "247538792217",
  appId: "1:247538792217:web:83549932a0c517d6087788"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

/* =========================================
   2. ESTADO DA APLICAÇÃO
========================================= */

const state = {
  user: null,
  salonId: null,
  salon: {},
  appointments: [],
  clients: [],
  services: [],
  professionals: [],
  currentDate: new Date(),
  currentView: "day",
  activePage: "agenda",
  bufferMinutes: 0,
  unsubscribers: []
};

const $ = (id) => document.getElementById(id);

const loadingScreen = $("loadingScreen");
const loginScreen = $("loginScreen");
const appScreen = $("app");

function hideLoading() {
  if (loadingScreen) loadingScreen.classList.add("hidden");
}

function showLogin() {
  if (loginScreen) loginScreen.classList.remove("hidden");
  if (appScreen) appScreen.classList.add("hidden");
}

function showApp() {
  if (loginScreen) loginScreen.classList.add("hidden");
  if (appScreen) appScreen.classList.remove("hidden");
  hideLoading();
}

/* =========================================
   3. NOTIFICAÇÕES
========================================= */

function notify(message, type = "success") {
  const oldToast = document.querySelector(".toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

function showError(error, fallback = "Ocorreu um erro.") {
  console.error(error);
  notify(error?.message || fallback, "error");
}

/* =========================================
   4. DATAS E HORAS
========================================= */

function dateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function formatTime(time) {
  return time || "--:--";
}

function timeToMinutes(time) {
  const [hours, minutes] = (time || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

/* =========================================
   5. CAMINHOS FIRESTORE
========================================= */

function salonDocument() {
  return doc(db, "saloes", state.salonId);
}

function userDocument(uid) {
  return doc(db, "users", uid);
}

function salonCollection(name) {
  return collection(db, "saloes", state.salonId, name);
}

function stopListeners() {
  state.unsubscribers.forEach((unsubscribe) => unsubscribe());
  state.unsubscribers = [];
}

function clearData() {
  stopListeners();

  state.appointments = [];
  state.clients = [];
  state.services = [];
  state.professionals = [];
  state.salon = {};
  state.salonId = null;
}


/* =========================================
   6. AUTENTICAÇÃO
========================================= */

const loginForm = $("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = $("loginEmail")?.value.trim();
    const password = $("loginPassword")?.value;

    if (!email || !password) {
      notify("Preencha o e-mail e a palavra-passe.", "error");
      return;
    }

    const button = loginForm.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
      await signInWithEmailAndPassword(auth, email, password);

    } catch (error) {
      console.error("ERRO DE LOGIN:", error.code, error.message);

      const messages = {
        "auth/invalid-credential": "E-mail ou palavra-passe incorretos.",
        "auth/user-not-found": "Utilizador não encontrado.",
        "auth/wrong-password": "Palavra-passe incorreta.",
        "auth/too-many-requests": "Demasiadas tentativas. Tente mais tarde.",
        "auth/operation-not-allowed": "O método E-mail/Senha não está ativo.",
        "auth/unauthorized-domain": "Este domínio não está autorizado no Firebase.",
        "auth/invalid-api-key": "A chave de configuração do Firebase está incorreta.",
        "auth/network-request-failed": "Falha de ligação à Internet."
      };

      notify(
        messages[error.code] || `Erro Firebase: ${error.code || error.message}`,
        "error"
      );

    } finally {
      if (button) button.disabled = false;
    }
  });
}

const logoutBtn = $("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (error) {
      showError(error, "Não foi possível terminar a sessão.");
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  clearData();
  state.user = user;

  if (!user) {
    showLogin();
    hideLoading();
    return;
  }

  try {
    const profileSnapshot = await getDoc(userDocument(user.uid));

    if (!profileSnapshot.exists()) {
      throw new Error(
        "O perfil deste utilizador ainda não está configurado. É necessário associar o utilizador a um salão no Firestore."
      );
    }

    const profile = profileSnapshot.data();

    if (!profile.salonId) {
      throw new Error("O perfil não tem um salonId associado.");
    }

    state.salonId = profile.salonId;

    const salonSnapshot = await getDoc(salonDocument());

    if (!salonSnapshot.exists()) {
      throw new Error("O salão associado não foi encontrado no Firestore.");
    }

    state.salon = salonSnapshot.data();
    state.bufferMinutes = Number(state.salon.bufferMinutes || 0);

    showApp();
    applySalonSettings();
    setupNavigation();
    setupAgenda();
    setupForms();
    setupMobileMenu();
    startDataListeners();

  } catch (error) {
    console.error("ERRO AO CARREGAR O SALÃO:", error);
    showLogin();
    hideLoading();
    notify(error.message || "Não foi possível carregar o salão.", "error");
  }
});

/* =========================================
   7. CARREGAMENTO DOS DADOS
========================================= */

function startDataListeners() {
  stopListeners();

  listenCollection("agendamentos", "appointments");
  listenCollection("clientes", "clients");
  listenCollection("servicos", "services");
  listenCollection("profissionais", "professionals");
}

function listenCollection(collectionName, stateName) {
  const ref = salonCollection(collectionName);

  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      state[stateName] = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }));

      if (stateName === "appointments") renderCalendar();
      if (stateName === "clients") renderClients();
      if (stateName === "services") {
        renderServices();
        refreshAppointmentOptions();
      }
      if (stateName === "professionals") {
        renderProfessionals();
        refreshAppointmentOptions();
      }
    },
    (error) => {
      console.error(`Erro na coleção ${collectionName}:`, error);
      notify(`Não foi possível carregar ${collectionName}. Verifique as regras do Firestore.`, "error");
    }
  );

  state.unsubscribers.push(unsubscribe);
}

/* =========================================
   8. CONFIGURAÇÕES DO SALÃO
========================================= */

function applySalonSettings() {
  const name = state.salon.name || "EBS Beauty Essencial";

  const salonName = $("salonName");
  if (salonName) salonName.textContent = name;

  const settingName = $("settingSalonName");
  if (settingName) settingName.value = name;

  const bufferInput = $("bufferMinutes");
  if (bufferInput) bufferInput.value = state.bufferMinutes;
}

const saveSettingsBtn = $("saveSettingsBtn");

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", async () => {
    if (!state.salonId) return;

    const name = $("settingSalonName")?.value.trim();
    const buffer = Number($("bufferMinutes")?.value || 0);

    if (!name) {
      notify("Indique o nome do salão.", "error");
      return;
    }

    if (buffer < 0 || buffer > 120) {
      notify("O intervalo deve estar entre 0 e 120 minutos.", "error");
      return;
    }

    try {
      await updateDoc(salonDocument(), {
        name,
        bufferMinutes: buffer,
        updatedAt: serverTimestamp()
      });

      state.salon.name = name;
      state.bufferMinutes = buffer;

      applySalonSettings();
      notify("Configurações guardadas.");
    } catch (error) {
      showError(error, "Não foi possível guardar as configurações.");
    }
  });
}

/* =========================================
   9. NAVEGAÇÃO
========================================= */

function setupNavigation() {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      openPage(page);
    });
  });
}

function openPage(page) {
  state.activePage = page;

  document.querySelectorAll(".page").forEach((element) => {
    element.classList.remove("active");
  });

  const selectedPage = $(`page-${page}`);
  if (selectedPage) selectedPage.classList.add("active");

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    agenda: "Agenda",
    clients: "Clientes",
    services: "Serviços",
    team: "Equipa",
    settings: "Configurações"
  };

  const title = $("pageTitle");
  if (title) title.textContent = titles[page] || "EBS Essencial";

  document.querySelector(".sidebar")?.classList.remove("open");
}

/* =========================================
   10. MENU MOBILE
========================================= */

function setupMobileMenu() {
  const menuButton = $("mobileMenuBtn");
  const sidebar = $("sidebar");

  if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
}

/* =========================================
   11. AGENDA
========================================= */

function setupAgenda() {
  $("prevDateBtn")?.addEventListener("click", () => {
    moveCalendar(-1);
  });

  $("nextDateBtn")?.addEventListener("click", () => {
    moveCalendar(1);
  });

  $("todayBtn")?.addEventListener("click", () => {
    state.currentDate = new Date();
    renderCalendar();
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.view;

      document.querySelectorAll("[data-view]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      renderCalendar();
    });
  });

  $("agendaDate")?.addEventListener("change", (event) => {
    if (event.target.value) {
      state.currentDate = parseDate(event.target.value);
      renderCalendar();
    }
  });

  $("professionalFilter")?.addEventListener("change", renderCalendar);

  $("newAppointmentBtn")?.addEventListener("click", () => {
    openAppointmentDialog();
  });

  renderCalendar();
}

function moveCalendar(direction) {
  const date = new Date(state.currentDate);

  if (state.currentView === "day") {
    date.setDate(date.getDate() + direction);
  } else if (state.currentView === "week") {
    date.setDate(date.getDate() + direction * 7);
  } else {
    date.setMonth(date.getMonth() + direction);
  }

  state.currentDate = date;
  renderCalendar();
}

function renderCalendar() {
  const canvas = $("calendarCanvas");
  if (!canvas) return;

  const label = $("currentDateLabel");
  const dateInput = $("agendaDate");

  if (label) {
    if (state.currentView === "month") {
      label.textContent = new Intl.DateTimeFormat("pt-PT", {
        month: "long",
        year: "numeric"
      }).format(state.currentDate);
    } else {
      label.textContent = formatDate(state.currentDate);
    }
  }

  if (dateInput) dateInput.value = dateKey(state.currentDate);

  if (state.currentView === "day") {
    renderDayView(canvas);
  } else if (state.currentView === "week") {
    renderWeekView(canvas);
  } else {
    renderMonthView(canvas);
  }
}

function getVisibleProfessionals() {
  const selected = $("professionalFilter")?.value || "all";

  if (selected === "all") return state.professionals;

  return state.professionals.filter((person) => person.id === selected);
}

function getAppointmentsForDate(date) {
  const key = dateKey(date);

  return state.appointments.filter((appointment) => {
    return appointment.date === key;
  });
}

function getProfessionalName(id) {
  return state.professionals.find((person) => person.id === id)?.name || "Profissional";
}

function getClientName(id) {
  return state.clients.find((client) => client.id === id)?.name || "Cliente";
}

function getServiceName(id) {
  return state.services.find((service) => service.id === id)?.name || "Serviço";
}

function appointmentStatusClass(status) {
  const classes = {
    "Agendado": "agendado",
    "Confirmado": "confirmado",
    "Em atendimento": "em-atendimento",
    "Concluído": "concluido",
    "Cancelado": "cancelado",
    "Não compareceu": "nao-compareceu"
  };

  return classes[status] || "agendado";
}

function appointmentButton(appointment) {
  return `
    <button class="appointment-block status-${appointmentStatusClass(appointment.status)}"
      data-edit-appointment="${escapeHTML(appointment.id)}">
      <strong>${escapeHTML(appointment.time || "")} · ${escapeHTML(getClientName(appointment.clientId))}</strong>
      <small>${escapeHTML(getServiceName(appointment.serviceId))}</small>
      <small>${escapeHTML(appointment.status || "Agendado")}</small>
    </button>
  `;
}

function renderDayView(canvas) {
  const professionals = getVisibleProfessionals();
  const appointments = getAppointmentsForDate(state.currentDate);

  if (!professionals.length) {
    canvas.innerHTML = `<div class="empty-state"><strong>Sem profissionais</strong>Adicione profissionais para começar a utilizar a agenda.</div>`;
    return;
  }

  const startHour = 8;
  const endHour = 20;

  canvas.innerHTML = `
    <div class="day-grid">
      <div class="day-grid-header" style="--professional-count:${professionals.length}">
        <div>Hora</div>
        ${professionals.map((person) => `
          <div>${escapeHTML(person.name)}</div>
        `).join("")}
      </div>

      <div class="day-grid-inner" style="--professional-count:${professionals.length}">
        ${Array.from({ length: endHour - startHour }, (_, index) => {
          const hour = startHour + index;

          return `
            <div class="time-cell">${String(hour).padStart(2, "0")}:00</div>
            ${professionals.map((person) => {
              const matching = appointments.filter((appointment) => {
                return appointment.professionalId === person.id &&
                  Math.floor(timeToMinutes(appointment.time) / 60) === hour;
              });

              return `
                <div class="slot-cell" data-slot-date="${dateKey(state.currentDate)}"
                  data-slot-time="${String(hour).padStart(2, "0")}:00"
                  data-slot-professional="${escapeHTML(person.id)}">
                  ${matching.map(appointmentButton).join("")}
                </div>
              `;
            }).join("")}
          `;
        }).join("")}
      </div>
    </div>
  `;

  canvas.querySelectorAll("[data-edit-appointment]").forEach((button) => {
    button.addEventListener("click", () => {
      const appointment = state.appointments.find((item) => item.id === button.dataset.editAppointment);
      if (appointment) openAppointmentDialog(appointment);
    });
  });

  canvas.querySelectorAll("[data-slot-date]").forEach((slot) => {
    slot.addEventListener("dblclick", () => {
      openAppointmentDialog(null, {
        date: slot.dataset.slotDate,
        time: slot.dataset.slotTime,
        professionalId: slot.dataset.slotProfessional
      });
    });
  });
}

/* =========================================
   12. VISTA SEMANAL
========================================= */

function getStartOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function renderWeekView(canvas) {
  const start = getStartOfWeek(state.currentDate);
  const professionals = getVisibleProfessionals();

  canvas.innerHTML = `
    <div class="week-grid">
      ${Array.from({ length: 7 }, (_, index) => {
        const day = addDays(start, index);
        const appointments = getAppointmentsForDate(day);

        return `
          <div class="week-day">
            <div class="week-day-header">
              ${new Intl.DateTimeFormat("pt-PT", { weekday: "short" }).format(day)}
              <small>${formatShortDate(day)}</small>
            </div>
            ${appointments
              .filter((appointment) => professionals.some((person) => person.id === appointment.professionalId))
              .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
              .map((appointment) => `
                <div class="week-event">
                  ${appointmentButton(appointment)}
                  <small>${escapeHTML(getProfessionalName(appointment.professionalId))}</small>
                </div>
              `).join("")}
          </div>
        `;
      }).join("")}
    </div>
  `;

  canvas.querySelectorAll("[data-edit-appointment]").forEach((button) => {
    button.addEventListener("click", () => {
      const appointment = state.appointments.find((item) => item.id === button.dataset.editAppointment);
      if (appointment) openAppointmentDialog(appointment);
    });
  });
}

/* =========================================
   13. VISTA MENSAL
========================================= */

function renderMonthView(canvas) {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = addDays(firstDay, -startOffset);

  const professionals = getVisibleProfessionals();

  const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  canvas.innerHTML = `
    <div class="month-grid">
      ${weekdays.map((day) => `<div class="month-weekday">${day}</div>`).join("")}

      ${Array.from({ length: 42 }, (_, index) => {
        const day = addDays(gridStart, index);
        const appointments = getAppointmentsForDate(day).filter((appointment) => {
          return professionals.some((person) => person.id === appointment.professionalId);
        });

        const isToday = dateKey(day) === dateKey(new Date());

        return `
          <div class="month-day ${isToday ? "today" : ""}">
            <div class="month-day-number">${day.getDate()}</div>
            ${appointments.slice(0, 3).map((appointment) => `
              <button class="month-event" data-edit-appointment="${escapeHTML(appointment.id)}">
                ${escapeHTML(appointment.time)} ${escapeHTML(getClientName(appointment.clientId))}
              </button>
            `).join("")}
            ${appointments.length > 3 ? `<small>+${appointments.length - 3} mais</small>` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;

  canvas.querySelectorAll("[data-edit-appointment]").forEach((button) => {
    button.addEventListener("click", () => {
      const appointment = state.appointments.find((item) => item.id === button.dataset.editAppointment);
      if (appointment) openAppointmentDialog(appointment);
    });
  });

  canvas.querySelectorAll(".month-day").forEach((element, index) => {
    element.addEventListener("dblclick", () => {
      const day = addDays(gridStart, index);
      state.currentDate = day;
      state.currentView = "day";
      document.querySelectorAll("[data-view]").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === "day");
      });
      renderCalendar();
    });
  });
}

/* =========================================
   14. FORMULÁRIO DE MARCAÇÕES
========================================= */

function refreshAppointmentOptions() {
  const clientSelect = $("appointmentClient");
  const professionalSelect = $("appointmentProfessional");
  const serviceSelect = $("appointmentService");

  if (clientSelect) {
    const selected = clientSelect.value;
    clientSelect.innerHTML = `<option value="">Selecionar cliente</option>` +
      state.clients.map((client) =>
        `<option value="${escapeHTML(client.id)}">${escapeHTML(client.name)}</option>`
      ).join("");
    clientSelect.value = selected;
  }

  if (professionalSelect) {
    const selected = professionalSelect.value;
    professionalSelect.innerHTML = `<option value="">Selecionar profissional</option>` +
      state.professionals.map((person) =>
        `<option value="${escapeHTML(person.id)}">${escapeHTML(person.name)}</option>`
      ).join("");
    professionalSelect.value = selected;
  }

  if (serviceSelect) {
    const selected = serviceSelect.value;
    serviceSelect.innerHTML = `<option value="">Selecionar serviço</option>` +
      state.services.map((service) =>
        `<option value="${escapeHTML(service.id)}">${escapeHTML(service.name)}</option>`
      ).join("");
    serviceSelect.value = selected;
  }

  const filter = $("professionalFilter");

  if (filter) {
    const selected = filter.value;
    filter.innerHTML = `<option value="all">Todos os profissionais</option>` +
      state.professionals.map((person) =>
        `<option value="${escapeHTML(person.id)}">${escapeHTML(person.name)}</option>`
      ).join("");
    filter.value = selected || "all";
  }
}

function openAppointmentDialog(appointment = null, preset = {}) {
  const dialog = $("appointmentDialog");
  const form = $("appointmentForm");

  if (!dialog || !form) {
    notify("A janela de marcação não foi encontrada.", "error");
    return;
  }

  form.reset();

  $("appointmentId").value = appointment?.id || "";
  $("appointmentDate").value = appointment?.date || preset.date || dateKey(state.currentDate);
  $("appointmentTime").value = appointment?.time || preset.time || "09:00";
  $("appointmentClient").value = appointment?.clientId || "";
  $("appointmentProfessional").value = appointment?.professionalId || preset.professionalId || "";
  $("appointmentService").value = appointment?.serviceId || "";
  $("appointmentDuration").value = appointment?.duration || 30;
  $("appointmentStatus").value = appointment?.status || "Agendado";
  $("appointmentValue").value = appointment?.value ?? "";
  $("appointmentNotes").value = appointment?.notes || "";

  const title = $("appointmentDialogTitle");
  if (title) title.textContent = appointment ? "Editar marcação" : "Nova marcação";

  const deleteButton = $("deleteAppointmentBtn");
  if (deleteButton) {
    deleteButton.classList.toggle("hidden", !appointment);
  }

  const whatsappButton = $("whatsappAppointmentBtn");
  if (whatsappButton) {
    whatsappButton.classList.toggle("hidden", !appointment);
  }

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function setupForms() {
  setupAppointmentForm();
  setupClientForm();
  setupServiceForm();
  setupProfessionalForm();
  setupDeleteAppointment();
  setupWhatsAppButton();
}

function setupAppointmentForm() {
  const form = $("appointmentForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = $("appointmentId").value;

    const appointment = {
      clientId: $("appointmentClient").value,
      professionalId: $("appointmentProfessional").value,
      serviceId: $("appointmentService").value,
      date: $("appointmentDate").value,
      time: $("appointmentTime").value,
      duration: Number($("appointmentDuration").value || 30),
      status: $("appointmentStatus").value || "Agendado",
      value: Number($("appointmentValue").value || 0),
      notes: $("appointmentNotes").value.trim(),
      updatedAt: serverTimestamp()
    };

    if (!appointment.clientId || !appointment.professionalId ||
        !appointment.serviceId || !appointment.date || !appointment.time) {
      notify("Preencha os campos obrigatórios.", "error");
      return;
    }

    if (appointment.duration < 5 || appointment.duration > 600) {
      notify("A duração deve estar entre 5 e 600 minutos.", "error");
      return;
    }

    if (!validateAppointment(appointment, id)) return;

    try {
      if (id) {
        await updateDoc(doc(salonCollection("agendamentos"), id), appointment);
        notify("Marcação atualizada.");
      } else {
        await addDoc(salonCollection("agendamentos"), {
          ...appointment,
          createdAt: serverTimestamp()
        });
        notify("Marcação criada.");
      }

      $("appointmentDialog")?.close();
    } catch (error) {
      showError(error, "Não foi possível guardar a marcação.");
    }
  });
}

/* =========================================
   15. VALIDAÇÃO DE HORÁRIOS
========================================= */

function validateAppointment(appointment, currentId = null) {
  const professional = state.professionals.find(
    (person) => person.id === appointment.professionalId
  );

  if (!professional) {
    notify("Selecione um profissional válido.", "error");
    return false;
  }

  const start = timeToMinutes(appointment.time);
  const end = start + appointment.duration;

  const workingStart = timeToMinutes(professional.start || "08:00");
  const workingEnd = timeToMinutes(professional.end || "17:00");

  if (start < workingStart || end > workingEnd) {
    notify(
      `O horário deve respeitar o horário de trabalho: ${professional.start || "08:00"}–${professional.end || "17:00"}.`,
      "error"
    );
    return false;
  }

  const hasConflict = state.appointments.some((existing) => {
    if (existing.id === currentId) return false;
    if (existing.professionalId !== appointment.professionalId) return false;
    if (existing.date !== appointment.date) return false;
    if (["Cancelado", "Não compareceu"].includes(existing.status)) return false;

    const existingStart = timeToMinutes(existing.time);
    const existingEnd = existingStart + Number(existing.duration || 30);

    const buffer = Number(state.bufferMinutes || 0);

    return start < existingEnd + buffer && end + buffer > existingStart;
  });

  if (hasConflict) {
    notify("Este profissional já tem uma marcação nesse horário ou no intervalo de segurança.", "error");
    return false;
  }

  return true;
}

/* =========================================
   16. APAGAR MARCAÇÃO
========================================= */

function setupDeleteAppointment() {
  $("deleteAppointmentBtn")?.addEventListener("click", async () => {
    const id = $("appointmentId")?.value;

    if (!id) return;

    if (!confirm("Tem a certeza de que pretende apagar esta marcação?")) return;

    try {
      await deleteDoc(doc(salonCollection("agendamentos"), id));
      $("appointmentDialog")?.close();
      notify("Marcação apagada.");
    } catch (error) {
      showError(error, "Não foi possível apagar a marcação.");
    }
  });
}

/* =========================================
   17. WHATSAPP
   O envio da mensagem não confirma
   automaticamente a marcação.
========================================= */

function setupWhatsAppButton() {
  $("whatsappAppointmentBtn")?.addEventListener("click", () => {
    const clientId = $("appointmentClient")?.value;
    const client = state.clients.find((item) => item.id === clientId);

    if (!client?.phone) {
      notify("Este cliente não tem número de telefone registado.", "error");
      return;
    }

    const phone = client.phone.replace(/\D/g, "");

    if (!phone) {
      notify("O número de telefone não é válido.", "error");
      return;
    }

    const date = $("appointmentDate").value;
    const time = $("appointmentTime").value;
    const serviceId = $("appointmentService").value;
    const service = state.services.find((item) => item.id === serviceId);

    const formattedDate = date
      ? new Intl.DateTimeFormat("pt-PT").format(parseDate(date))
      : "";

    const message =
      `Olá, ${client.name}! 😊\n\n` +
      `Gostaríamos de confirmar a sua marcação:\n` +
      `Serviço: ${service?.name || "Serviço"}\n` +
      `Data: ${formattedDate}\n` +
      `Hora: ${time}\n\n` +
      `Por favor, responda a esta mensagem para confirmar. Obrigado!`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );

    notify("Mensagem preparada. A confirmação continua pendente da resposta do cliente.");
  });
}

/* =========================================
   18. CLIENTES
========================================= */

function setupClientForm() {
  const form = $("clientForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = $("clientName").value.trim();
    const phone = $("clientPhone").value.trim();
    const email = $("clientEmail").value.trim();

    if (!name) {
      notify("Indique o nome do cliente.", "error");
      return;
    }

    try {
      await addDoc(salonCollection("clientes"), {
        name,
        phone,
        email,
        createdAt: serverTimestamp()
      });

      form.reset();
      notify("Cliente adicionado.");
    } catch (error) {
      showError(error, "Não foi possível adicionar o cliente.");
    }
  });
}

function renderClients() {
  const list = $("clientsList");
  if (!list) return;

  if (!state.clients.length) {
    list.innerHTML = `<div class="empty-state"><strong>Sem clientes</strong>Os clientes adicionados aparecerão aqui.</div>`;
    return;
  }

  list.innerHTML = state.clients
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt"))
    .map((client) => `
      <div class="list-item">
        <div>
          <strong>${escapeHTML(client.name)}</strong>
          <small>${escapeHTML(client.phone || "Sem telefone")} · ${escapeHTML(client.email || "Sem e-mail")}</small>
        </div>
        <button class="btn btn-small btn-danger" data-delete-client="${escapeHTML(client.id)}">Apagar</button>
      </div>
    `).join("");

  list.querySelectorAll("[data-delete-client]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deleteClient;

      if (!confirm("Apagar este cliente?")) return;

      try {
        await deleteDoc(doc(salonCollection("clientes"), id));
        notify("Cliente apagado.");
      } catch (error) {
        showError(error, "Não foi possível apagar o cliente.");
      }
    });
  });
}

/* =========================================
   19. SERVIÇOS
========================================= */

function setupServiceForm() {
  const form = $("serviceForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = $("serviceName").value.trim();
    const duration = Number($("serviceDuration").value || 30);
    const price = Number($("servicePrice").value || 0);

    if (!name) {
      notify("Indique o nome do serviço.", "error");
      return;
    }

    if (duration < 5 || duration > 600 || price < 0) {
      notify("Verifique a duração e o preço do serviço.", "error");
      return;
    }

    try {
      await addDoc(salonCollection("servicos"), {
        name,
        duration,
        price,
        createdAt: serverTimestamp()
      });

      form.reset();
      notify("Serviço adicionado.");
    } catch (error) {
      showError(error, "Não foi possível adicionar o serviço.");
    }
  });
}

function renderServices() {
  const list = $("servicesList");
  if (!list) return;

  if (!state.services.length) {
    list.innerHTML = `<div class="empty-state"><strong>Sem serviços</strong>Adicione os serviços disponíveis no salão.</div>`;
    return;
  }

  list.innerHTML = state.services.map((service) => `
    <div class="list-item">
      <div>
        <strong>${escapeHTML(service.name)}</strong>
        <small>${Number(service.duration || 0)} minutos · ${Number(service.price || 0).toFixed(2)} €</small>
      </div>
      <button class="btn btn-small btn-danger" data-delete-service="${escapeHTML(service.id)}">Apagar</button>
    </div>
  `).join("");

  list.querySelectorAll("[data-delete-service]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deleteService;

      if (!confirm("Apagar este serviço?")) return;

      try {
        await deleteDoc(doc(salonCollection("servicos"), id));
        notify("Serviço apagado.");
      } catch (error) {
        showError(error, "Não foi possível apagar o serviço.");
      }
    });
  });
}

/* =========================================
   20. PROFISSIONAIS
========================================= */

function setupProfessionalForm() {
  const form = $("professionalForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = $("professionalName").value.trim();
    const start = $("professionalStart").value || "08:00";
    const end = $("professionalEnd").value || "17:00";

    if (!name) {
      notify("Indique o nome do profissional.", "error");
      return;
    }

    if (timeToMinutes(start) >= timeToMinutes(end)) {
      notify("O fim do horário deve ser posterior ao início.", "error");
      return;
    }

    try {
      await addDoc(salonCollection("profissionais"), {
        name,
        start,
        end,
        active: true,
        createdAt: serverTimestamp()
      });

      form.reset();
      notify("Profissional adicionado.");
    } catch (error) {
      showError(error, "Não foi possível adicionar o profissional.");
    }
  });
}

function renderProfessionals() {
  const list = $("professionalsList");
  if (!list) return;

  if (!state.professionals.length) {
    list.innerHTML = `<div class="empty-state"><strong>Sem profissionais</strong>Adicione os profissionais do salão.</div>`;
    return;
  }

  list.innerHTML = state.professionals.map((person) => `
    <div class="list-item">
      <div>
        <strong>${escapeHTML(person.name)}</strong>
        <small>${escapeHTML(person.start || "08:00")} – ${escapeHTML(person.end || "17:00")}</small>
      </div>
      <button class="btn btn-small btn-danger" data-delete-professional="${escapeHTML(person.id)}">Apagar</button>
    </div>
  `).join("");

  list.querySelectorAll("[data-delete-professional]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deleteProfessional;

      const hasAppointments = state.appointments.some(
        (appointment) => appointment.professionalId === id &&
          !["Cancelado", "Não compareceu"].includes(appointment.status)
      );

      if (hasAppointments) {
        notify("Este profissional tem marcações associadas. Não pode ser apagado.", "error");
        return;
      }

      if (!confirm("Apagar este profissional?")) return;

      try {
        await deleteDoc(doc(salonCollection("profissionais"), id));
        notify("Profissional apagado.");
      } catch (error) {
        showError(error, "Não foi possível apagar o profissional.");
      }
    });
  });
}

/* =========================================
   21. INICIALIZAÇÃO
========================================= */

hideLoading();
