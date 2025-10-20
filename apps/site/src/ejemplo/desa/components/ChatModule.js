// components/ChatModule.js
// Componente de chat flotante AXSOL.ai autocontenido

const CHAT_BG = '#003D5B';
const CHAT_ACCENT = '#FFA500';

class ChatModule extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = {
      isOpen: false,
      isLoading: false,
      conversations: {},
      activeConversationId: null,
      promptTemplates: [
        { id: '689b4ea32981caee178d05e1', name: 'HSE Standard en Construccion'},
        { id: '68af4f752981caee178dcb9d', name: 'Calidad Estándar en Construcción' },
        { id: '68af4d9e2981caee178dca64', name: 'Reporte de Avance para Construcción' },
        { id: '68af4fef2981caee178dcbf3', name: 'Planificación en Construcción' },
        { id: '68af51b92981caee178dccff', name: 'Logística en Construcción' },
        { id: '68af552f2981caee178dce32', name: 'Análisis Civil en Construcción' },
        { id: '68af50dc2981caee178dcc9f', name: 'Verificación Topográfica' },
        { id: '68af351d2981caee178dc522', name: 'Auditoría en Sostenibilidad' }
      ],
      activePromptTemplate: '689b4ea32981caee178d05e1',
      isGalleryOpen: false
    };
    this.config = { chatEnabled: false };
  }

  // --- CICLO DE VIDA Y CONFIGURACIÓN ---
  setConfig(config) {
    this.config = config;
    // Actualizar el prompt por defecto desde config
    if (this.config.rutas?.api_chat_promp_template) {
      this.state.promptTemplates[0].id = this.config.rutas.api_chat_promp_template;
      this.state.activePromptTemplate = this.config.rutas.api_chat_promp_template;
    }
    this._init();
  }

  _init() {
    if (!this.config.chatEnabled) return;
    this._loadConversations();
    this._render();
  }

  // --- GESTIÓN DE CONVERSACIONES ---
  _uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  _loadConversations() {
    const saved = localStorage.getItem('axsol-chat-conversations');
    if (saved) {
      this.state.conversations = JSON.parse(saved);
      const ids = Object.keys(this.state.conversations);
      if (ids.length > 0) {
        this.state.activeConversationId = ids[ids.length - 1]; // Activar la más reciente
      } else {
        this._createNewConversation();
      }
    } else {
      this._createNewConversation();
    }
  }

  _saveConversations() {
    localStorage.setItem('axsol-chat-conversations', JSON.stringify(this.state.conversations));
  }

  _createNewConversation() {
    const newId = this._uuid();
    this.state.conversations[newId] = {
      id: newId,
      title: 'Nuevo Chat',
      messages: [{
        sender: 'ai',
        text: 'Hola, soy el asistente de obra. ¿En qué puedo ayudarte hoy?'
      }],
      createdAt: new Date().toISOString()
    };
    this.state.activeConversationId = newId;
    this._saveConversations();
    this._update();
  }

  _switchConversation(id) {
    this.state.activeConversationId = id;
    this._closeImageGallery();
    this._update();
  }

  _getActiveConversation() {
    return this.state.conversations[this.state.activeConversationId];
  }

  _addMessage(msg) {
    const activeConvo = this._getActiveConversation();
    if (!activeConvo) return;
    activeConvo.messages.push(msg);
    // Si es el primer mensaje del usuario, usarlo como título
    if (activeConvo.messages.length === 2) {
        activeConvo.title = msg.text.substring(0, 30) + (msg.text.length > 30 ? '...' : '');
    }
    this._saveConversations();
    this._update();
    setTimeout(() => {
      const msgList = this.shadowRoot.querySelector('.chat-messages');
      if (msgList) msgList.scrollTop = msgList.scrollHeight;
    }, 50);
  }

  async _sendMessage(text) {
    if (!text || !this.state.activeConversationId) return;
    this._closeImageGallery();
    this._addMessage({ sender: 'user', text });
    this.state.isLoading = true;
    this._update();
    try {
      const data = await this._sendChatMessage({
          question: text,
          conversationId: this.state.activeConversationId,
          promptTemplate: this.state.activePromptTemplate
      });
      this._addMessage({
        sender: 'ai',
        text: data.texto,
        imagenes: data.imagenes || [],
        raw: data
      });
    } catch (e) {
      this._addMessage({ sender: 'ai', text: `Error: ${e.message}` });
    }
    this.state.isLoading = false;
    this._update();
  }

  async _sendChatMessage({ question, conversationId, promptTemplate }) {
    const apiChatUrl = this.config.rutas.api_chat_url;
    const project = this.config.proyecto.id_proyecto;
    //const project = "68379c08e6954af9ff9ffa76"; // ID de proyecto HARD CODEADO
    const pTemplate = promptTemplate || this.config.rutas.api_chat_promp_template;

    const baseUrl = apiChatUrl + conversationId;
    const params = new URLSearchParams();
    params.append('question', question);
    params.append('project', project);
    params.append('promp_template', pTemplate);

    const url = `${baseUrl}?${params.toString()}`;
    console.log('URL de la API de Chat:', url);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error en API de Chat:', errorText);
      throw new Error('Error al contactar al agente de IA');
    }

    const data = await res.json();
    return {
      texto: data.answer,
      imagenes: data.data || []
    };
  }

  // --- ACCIONES DE MENSAJE Y UI ---
  _copyToClipboard(text) { navigator.clipboard.writeText(text); }

  _openImageGallery(imagenes, startIndex = 0) {
    if (!imagenes || imagenes.length === 0) return;

    const links = imagenes.map(item => {
        let fecha = '';
        if (item.metadata?.fecha_captura) {
            try {
                fecha = new Date(item.metadata.fecha_captura).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch (e) {}
        }
        const captionText = item.caption?.map(c => `${c.titulo_seccion}: ${c.texto_resultado}`).join('<br>') || 'Sin descripción';
        const title = `${captionText}<br><small style="opacity: 0.8; font-size: 0.9em; display: block; margin-top: 8px;">Fecha de captura: ${fecha}</small>`;
        return {
            href: `https://dl0myuhn31sqd.cloudfront.net/${item.metadata?.archivo_s3_key}?format=webp`,
            title: title
        };
    });

    const galleryElement = document.querySelector('#blueimp-gallery');
    const chatWindow = this.shadowRoot.querySelector('.chat-window');

    const options = {
        index: startIndex,
        onopened: () => {
            this.state.isGalleryOpen = true;
            if (chatWindow) chatWindow.style.display = 'none';
        },
        onclosed: () => {
            this.state.isGalleryOpen = false;
            if (chatWindow) chatWindow.style.display = 'flex';
            this.gallery = null;
        },
        onslide: (index, slide) => {
            const currentLink = links[index];
            const titleElement = this.gallery.container.querySelector('.title');
            if (titleElement && currentLink) {
                titleElement.innerHTML = currentLink.title || '';
            }
        },
        slideshowInterval: 5000,
        stretchImages: 'contain',
        container: galleryElement
    };

    const initGallery = (retries = 5) => {
        if (window.blueimp) {
            this.gallery = window.blueimp.Gallery(links, options);
        } else if (retries > 0) {
            setTimeout(() => initGallery(retries - 1), 100);
        } else {
            console.error('blueimp-gallery.js not loaded after multiple attempts.');
        }
    };
    initGallery();
  }

  _emitCzml(imagenes) {
    const czml = [
      { id: 'document', version: '1.0' },
      ...imagenes.map((img, i) => ({
        id: `img_${img.id || i}`,
        position: { cartographicDegrees: [...(img.metadata?.coordenadas || [0,0,0]), 0] },
        point: { pixelSize: 16, color: { rgba: [255, 165, 0, 255] } },
        description: img.textoBD || ''
      }))
    ];
    this.dispatchEvent(new CustomEvent('onCzmlGenerated', { detail: { czml: JSON.stringify(czml) }, bubbles: true, composed: true }));
  }

  _emitKml(imagenes) {
    const kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n${imagenes.map(img =>
      `<Placemark><name>${img.textoBD || ''}</name><Point><coordinates>${(img.metadata?.coordenadas || []).join(',')},0</coordinates></Point></Placemark>`
    ).join('\n')}</Document></kml>`;
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'evidencia.kml';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  _emitAlert(data) {
    this.dispatchEvent(new CustomEvent('onRegisterAlert', { detail: { data }, bubbles: true, composed: true }));
  }

  _closeImageGallery() {
    if (this.gallery) {
        this.gallery.close();
    }
  }

  // --- RENDERIZADO ---
  _render() {
    const { isOpen, isLoading, conversations, activeConversationId, isGalleryOpen, promptTemplates, activePromptTemplate } = this.state;
    const activeConvo = this._getActiveConversation();
    const messages = activeConvo ? activeConvo.messages : [];

    this.shadowRoot.innerHTML = `
      <style>
        :host { position: fixed; z-index: 9999; right: 24px; top: 50%; transform: translateY(-50%); font-family: 'Inter', 'Segoe UI', Arial, sans-serif; }
        .chat-fab { width: 68px; height: 68px; border-radius: 50%; background: ${CHAT_BG}; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 18px #0002; cursor: pointer; border: none; font-size: 2.2em; transition: all 0.2s; position: relative; }
        .chat-fab:hover { box-shadow: 0 4px 16px #0002; }
        .ai-icon svg { display: block; width: 44px; height: 44px; animation: ai-pulse 1.35s infinite cubic-bezier(.4,0,.4,1); }
        @keyframes ai-pulse { 0%, 100% { filter: drop-shadow(0 0 0 #FFA50044); transform: scale(1); } 50% { filter: drop-shadow(0 0 22px #FFA500cc) drop-shadow(0 0 10px #fff7); transform: scale(1.16); } }
        
        .chat-window { display: flex; width: 560px; max-width: 95vw; height: 75vh; background: #18202acc; backdrop-filter: blur(10px); border-radius: 15px; box-shadow: 0 6px 38px #0006, 0 1.5px 8px #0003; overflow: hidden; border: 1.5px solid #232c39; position: fixed; right: 24px; top: 50%; transform: translateY(100%) translateY(-50%); opacity: 0; pointer-events: none; transition: transform 0.38s cubic-bezier(.6,0,.4,1), opacity 0.31s; }
        

        :host([chat-open]) .chat-window, .chat-window.open { transform: translateY(-50%); opacity: 1; pointer-events: all; }

        .blueimp-gallery {
            width: 60vw;
            height: 80vh;
            left: 20vw;
            top: 10vh;
            right: 20vw;
            bottom: 10vh;
            margin: 0;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            border-radius: 8px;
            overflow: hidden;
        }
        .blueimp-gallery > .title {
            background: rgba(0,0,0,0.7);
            padding: 15px;
            font-size: 16px;
            line-height: 1.4;
        }

        .sidebar { width: 180px; background: #0003; border-right: 1px solid #232c39; display: flex; flex-direction: column; padding: 8px; }
        .new-chat-btn { background: #ffffff18; color: #fff; border: none; border-radius: 8px; padding: 10px; font-size: 0.9em; cursor: pointer; margin-bottom: 10px; text-align: left; }
        .convo-list { flex: 1; overflow-y: auto; }
        .convo-tab { background: none; border: none; color: #f0f0f0; padding: 10px; border-radius: 6px; text-align: left; cursor: pointer; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9em; }
        .convo-tab.active { background: #ffffff22; }

        .main-chat { flex: 1; display: flex; flex-direction: column; }
        .chat-header { background: transparent; color: #fff; padding: 8px 12px 8px 18px; font-weight: 600; display: flex; align-items: center; border-bottom: 1px solid #232c39; justify-content: space-between; }
        .profile-selector select { background: #ffffff18; color: #fff; border: 1px solid #ffffff33; border-radius: 6px; padding: 4px 8px; font-size: 0.85em; }
        .profile-selector option { background: #333; color: #fff; }
        .chat-close { background: none; border: none; color: #fff; font-size: 1.6em; cursor: pointer; opacity: 0.84; transition: opacity 0.15s; padding: 0 8px; }
        .chat-close:hover { opacity: 1; }
        
        .chat-messages { flex: 1; overflow-y: auto; padding: 14px 10px 8px 10px; display: flex; flex-direction: column; gap: 7px; color: #f5f7fa; }
        .msg-row { display: flex; max-width: 100%; }
        .msg-row-user { justify-content: flex-end; }
        .msg-ai { background: #23405dcc; color: #f7fafc; align-self: flex-start; border-radius: 12px 12px 12px 4px; padding: 8px 12px; max-width: 85%; font-size: 0.98em; margin-bottom: 2px; }
        .msg-user { background: #eaeaea88; color: #fff; align-self: flex-end; border-radius: 12px 12px 4px 12px; padding: 8px 12px; max-width: 85%; font-size: 0.98em; }
        .msg-actions { display: flex; gap: 3px; margin-top: 4px; justify-content: flex-start; align-items: center; }
        .msg-action-btn { background: none; color: #f7fafc; border: none; border-radius: 6px; padding: 4px; font-size: 1.14em; cursor: pointer; opacity: 1; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
        .msg-action-btn:disabled { opacity: 0.30; cursor: not-allowed; color: #bfc9d6; }
        .msg-action-btn:hover:not(:disabled) { background: #23324a99; color: #FFA500; opacity: 1; }
        .msg-images { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .msg-image-thumb { width: 70px; height: 70px; border-radius: 8px; object-fit: cover; cursor: pointer; border: 1px solid #ffffff22; transition: transform .2s; }
        .msg-image-thumb:hover { transform: scale(1.05); border-color: #FFA500; }

        .chat-input-row { display: flex; gap: 5px; padding: 10px; background: transparent; border-top: 1px solid #232c39; }
        .chat-input { flex: 1; border-radius: 7px; border: 1px solid #e2e2e2; padding: 8px 10px; font-size: 1em; background: #f9f9fb; color: #003D5B; outline: none; transition: border 0.15s; }
        .chat-input:focus { border: 1.5px solid #FFA500; background: #fff; }
        .chat-send-btn { background: ${CHAT_ACCENT}; color: #fff; border: none; border-radius: 7px; padding: 0 14px; font-size: 1.18em; cursor: pointer; font-weight: 600; height: 36px; display: flex; align-items: center; justify-content: center; }
        .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .chat-loading { color: #ccc; padding: 6px 0 0 8px; font-size: 0.9em; align-self: flex-start; }

      </style>
      ${!isOpen ? `<button class="chat-fab ai-fab" title="Chatear con el Asistente de la Obra">
        <span class="ai-icon" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="19" fill="#003D5B"/><g><circle cx="22" cy="22" r="9" fill="#FFA500" fill-opacity="0.13"/><circle cx="22" cy="22" r="5.5" fill="#FFA500"/></g><g><circle cx="11.5" cy="15.5" r="2.1" fill="#FFA500"/><circle cx="34" cy="17" r="1.6" fill="#FFA500"/><circle cx="16.5" cy="34" r="1.2" fill="#FFA500"/><circle cx="29.5" cy="34" r="1.1" fill="#FFA500"/></g></svg>
        </span>
      </button>` : `
        <div class="chat-window open">
          <div class="sidebar">
            <button class="new-chat-btn">+ Nuevo Chat</button>
            <div class="convo-list">
              ${Object.values(conversations).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(convo => `
                <button class="convo-tab ${convo.id === activeConversationId ? 'active' : ''}" data-id="${convo.id}">${convo.title}</button>
              `).join('')}
            </div>
          </div>
          <div class="main-chat">
            <div class="chat-header">
              <div class="profile-selector">
                <select class="prompt-select">
                  ${promptTemplates.map(p => `<option value="${p.id}" ${p.id === activePromptTemplate ? 'selected' : ''}>${p.name}</option>`).join('')}
                </select>
              </div>
              <button class="chat-close" title="Cerrar">&times;</button>
            </div>
            <div class="chat-messages">
              ${messages.map((msg, msgIndex) => `
                <div class="msg-row ${msg.sender === 'user' ? 'msg-row-user' : 'msg-row-ai'}">
                  <div class="${msg.sender === 'user' ? 'msg-user' : 'msg-ai'}" data-msg-index="${msgIndex}">
                    <span>${msg.text}</span>
                    ${msg.imagenes && msg.imagenes.length > 0 ? `
                      <div class="msg-images">
                        ${msg.imagenes.map((item, index) => {
                          const thumbUrl = `https://dl0myuhn31sqd.cloudfront.net/${item.metadata?.archivo_s3_key}?format=webp&width=100`;
                          const description = item.caption?.map(c => c.texto_resultado).join('\n') || 'Imagen de evidencia';
                          console.log(`Thumbnail URL for index ${index}:`, thumbUrl);
                          return `<img src="${thumbUrl}" 
                               class="msg-image-thumb" 
                               data-img-index="${index}" 
                               alt="${description}" />`;
                        }).join('')}
                      </div>
                    ` : ''}
                    ${msg.sender === 'ai' && msg.text && msg.text.length > 0 ? `
                      <div class="msg-actions" data-msg-index="${msgIndex}">
                        <button class="msg-action-btn" title="Copiar" data-action="copy"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1m3 4H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m0 18H8V7h11v16Z"/></svg></button>
                        <button class="msg-action-btn" title="Ver imágenes" data-action="gallery" ${!msg.imagenes||msg.imagenes.length===0?'disabled':''}><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2m-2 0H5V5h14v14m-3.5-7l-2.5 3.01L10.5 13l-4.5 6h13z"/></svg></button>
                        <button class="msg-action-btn" title="Ver en mapa" data-action="map" ${!msg.imagenes||msg.imagenes.length===0?'disabled':''}><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg></button>
                        <button class="msg-action-btn" title="Descargar KML" data-action="kml" ${!msg.imagenes||msg.imagenes.length===0?'disabled':''}><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8m-6 14a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2m2-10h-2V3.5L18.5 9H16Z"/></svg></button>
                        <button class="msg-action-btn" title="Registrar alerta" data-action="alert"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M13 13h-2V7h2m0 8h-2v-2h2m-1-9a9 9 0 1 0 0 18a9 9 0 0 0 0-18Z"/></svg></button>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
              ${isLoading ? `<div class="chat-loading"><span></span><span></span><span></span></div>` : ''}
            </div>
            <form class="chat-input-row" autocomplete="off">
              <input class="chat-input" name="chatInput" type="text" placeholder="Escribe tu mensaje..." required ${isLoading ? 'disabled' : ''} />
              <button class="chat-send-btn" type="submit" ${isLoading ? 'disabled' : ''}>➤</button>
            </form>
          </div>
        </div>
      `}
    `;
    this._attachDelegatedEvents();
  }

  _attachDelegatedEvents() {
    const mainChat = this.shadowRoot.querySelector('.main-chat');
    if (mainChat && !mainChat.dataset.eventsAttached) {
        mainChat.dataset.eventsAttached = 'true';

        mainChat.addEventListener('click', (e) => {
            const target = e.target;
            const activeConvo = this._getActiveConversation();
            if (!activeConvo) return;

            // Delegated event for image thumbnails
            const thumb = target.closest('.msg-image-thumb');
            if (thumb) {
                const msgContainer = thumb.closest('[data-msg-index]');
                if (!msgContainer) return;

                const msgIndex = parseInt(msgContainer.dataset.msgIndex, 10);
                const thumbIndex = parseInt(thumb.dataset.imgIndex, 10);
                const msg = activeConvo.messages[msgIndex];

                if (msg && msg.imagenes) {
                    this._openImageGallery(msg.imagenes, thumbIndex);
                }
                return;
            }

            // Delegated event for message action buttons
            const actionButton = target.closest('.msg-action-btn');
            if (actionButton) {
                const msgContainer = actionButton.closest('[data-msg-index]');
                if (!msgContainer) return;

                const msgIndex = parseInt(msgContainer.dataset.msgIndex, 10);
                const msg = activeConvo.messages[msgIndex];
                const action = actionButton.dataset.action;

                if (msg) {
                    if (action === 'copy') this._copyToClipboard(msg.text);
                    if (action === 'gallery') this._openImageGallery(msg.imagenes);
                    if (action === 'map') this._emitCzml(msg.imagenes);
                    if (action === 'kml') this._emitKml(msg.imagenes);
                    if (action === 'alert') this._emitAlert(msg.raw);
                }
                return;
            }
        });
    }

    // Keep non-delegated events here
    const fab = this.shadowRoot.querySelector('.chat-fab');
    if (fab) fab.onclick = () => { this.state.isOpen = true; this.setAttribute('chat-open', ''); this._update(); };
    const closeBtn = this.shadowRoot.querySelector('.chat-close');
    if (closeBtn) closeBtn.onclick = () => { this.state.isOpen = false; this.removeAttribute('chat-open'); this._update(); };
    
    const form = this.shadowRoot.querySelector('form.chat-input-row');
    if (form) {
      form.onsubmit = e => {
        e.preventDefault();
        const input = this.shadowRoot.querySelector('.chat-input');
        if (input && input.value.trim()) {
          this._sendMessage(input.value.trim());
          input.value = '';
        }
      };
    }

    const newChatBtn = this.shadowRoot.querySelector('.new-chat-btn');
    if (newChatBtn) newChatBtn.onclick = () => this._createNewConversation();

    this.shadowRoot.querySelectorAll('.convo-tab').forEach(tab => {
      tab.onclick = () => this._switchConversation(tab.dataset.id);
    });

    const promptSelect = this.shadowRoot.querySelector('.prompt-select');
    if (promptSelect) {
        promptSelect.onchange = (e) => {
            this.state.activePromptTemplate = e.target.value;
            this._closeImageGallery();
        };
    }

    const galleryCloseBtn = this.shadowRoot.querySelector('.gallery-close-btn');
    if (galleryCloseBtn) galleryCloseBtn.onclick = () => this._closeImageGallery();
  }

  _attachEvents_OLD() {
    const fab = this.shadowRoot.querySelector('.chat-fab');
    if (fab) fab.onclick = () => { this.state.isOpen = true; this.setAttribute('chat-open', ''); this._update(); };
    const closeBtn = this.shadowRoot.querySelector('.chat-close');
    if (closeBtn) closeBtn.onclick = () => { this.state.isOpen = false; this.removeAttribute('chat-open'); this._update(); };
    
    const form = this.shadowRoot.querySelector('form.chat-input-row');
    if (form) {
      form.onsubmit = e => {
        e.preventDefault();
        const input = this.shadowRoot.querySelector('.chat-input');
        if (input && input.value.trim()) {
          this._sendMessage(input.value.trim());
          input.value = '';
        }
      };
    }

    const newChatBtn = this.shadowRoot.querySelector('.new-chat-btn');
    if (newChatBtn) newChatBtn.onclick = () => this._createNewConversation();

    this.shadowRoot.querySelectorAll('.convo-tab').forEach(tab => {
      tab.onclick = () => this._switchConversation(tab.dataset.id);
    });

    const promptSelect = this.shadowRoot.querySelector('.prompt-select');
    if (promptSelect) {
        promptSelect.onchange = (e) => {
            this.state.activePromptTemplate = e.target.value;
            this._closeImageGallery();
        };
    }

    const galleryCloseBtn = this.shadowRoot.querySelector('.gallery-close-btn');
    if (galleryCloseBtn) galleryCloseBtn.onclick = () => this._closeImageGallery();

    
  }

  _update() {
    this._render();
  }
}

customElements.define('axsol-chat-module', ChatModule);

export default ChatModule;

