import io from 'socket.io-client'
import { userService } from './user'

export const SOCKET_EVENT_ADD_MSG = 'chat-add-msg'
export const SOCKET_EMIT_SEND_MSG = 'chat-send-msg'
export const SOCKET_EMIT_SET_TOPIC = 'chat-set-topic'
export const SOCKET_EMIT_USER_WATCH = 'user-watch'

export const SOCKET_EVENT_USER_UPDATED = 'user-updated'
export const SOCKET_EVENT_REVIEW_ADDED = 'review-added'
export const SOCKET_EVENT_REVIEW_REMOVED = 'review-removed'
export const SOCKET_EVENT_REVIEW_ABOUT_YOU = 'review-about-you'

const SOCKET_EMIT_LOGIN = 'set-user-socket'
const SOCKET_EMIT_LOGOUT = 'unset-user-socket'


const baseUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://minday-backend.onrender.com'  // your backend URL
    : '//localhost:3030'
export const socketService = createSocketService()

window.socketService = socketService

socketService.setup()


function createSocketService() {
    var socket = null
    const socketService = {
       async setup() {
            try {
                // Condition if the server is not working
                const res = await fetch(`${baseUrl}/api/ping`)
                if (!res.ok) throw new Error('Server not responding')
                socket = io(baseUrl)
                const user = userService.getLoggedinUser()
                if (user) this.login(user._id)
            } catch (err) {
                console.warn('Socket server unavailable, using dummy service instead')
                Object.assign(socketService, createDummySocketService())
                socketService.setup()
            }
        },
        on(eventName, cb) {
            if (!socket) return;
            socket.on(eventName, cb)
        },
        off(eventName, cb = null) {
            if (!socket) return;
            if (!cb) socket.removeAllListeners(eventName)
            else socket.off(eventName, cb)
        },
        emit(eventName, data) {
            if (!socket) return;
            socket.emit(eventName, data)
        },
        login(userId) {
            if (!socket) return;
            socket.emit(SOCKET_EMIT_LOGIN, userId)
        },
        logout() {
            if (!socket) return;
            socket.emit(SOCKET_EMIT_LOGOUT)
        },
        terminate() {
            socket = null
        },

    }
    return socketService
}

function createDummySocketService() {
    var listenersMap = {}
    const socketService = {
        listenersMap,
        setup() {
            listenersMap = {}
        },
        terminate() {
            this.setup()
        },
        login() {
            // console.log('Dummy socket service here, login - got it')
        },
        logout() {
            // console.log('Dummy socket service here, logout - got it')
        },
        on(eventName, cb) {
            listenersMap[eventName] = [...(listenersMap[eventName]) || [], cb]
        },
        off(eventName, cb) {
            if (!listenersMap[eventName]) return
            if (!cb) delete listenersMap[eventName]
            else listenersMap[eventName] = listenersMap[eventName].filter(l => l !== cb)
        },
        emit(eventName, data) {
            var listeners = listenersMap[eventName]
            if (eventName === SOCKET_EMIT_SEND_MSG) {
                listeners = listenersMap[SOCKET_EVENT_ADD_MSG]
            }

            if (!listeners) return

            listeners.forEach(listener => {
                listener(data)
            })
        },
        // Functions for easy testing of pushed data
        testChatMsg() {
            this.emit(SOCKET_EVENT_ADD_MSG, { from: 'Someone', txt: 'Aha it worked!' })
        },
        testUserUpdate() {
            this.emit(SOCKET_EVENT_USER_UPDATED, { ...userService.getLoggedinUser(), score: 555 })
        }
    }
    window.listenersMap = listenersMap
    return socketService
}


// Basic Tests
// function cb(x) {console.log('Socket Test - Expected Puk, Actual:', x)}
// socketService.on('baba', cb)
// socketService.on('baba', cb)
// socketService.on('baba', cb)
// socketService.on('mama', cb)
// socketService.emit('baba', 'Puk')
// socketService.off('baba', cb)
