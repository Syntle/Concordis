<template>
  <v-container fluid>
    <v-row>
      <v-col md="4" lg="4" xl="4">
        <v-dialog v-model="showFriendReq" persistent width="500">
          <v-card class="text-center">
            <v-card-title class="text-center" v-text="'Friend Request!'" />
            <v-card-text>
              The user you are chatting with has requested to add you!
            </v-card-text>
            <v-card-text>
              By clicking "ACCEPT" you agree to let the user get your Discord
              username, discriminator and avatar.
            </v-card-text>
            <v-card-text>
              This is to give both users a way to continue chatting outside of
              this service!
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="red darken-3"
                @click="rejectedFriend()"
                v-text="'Reject'"
              />

              <v-btn
                color="green darken-2"
                @click="acceptedFriend()"
                v-text="'Accept'"
              />
            </v-card-actions>
          </v-card>
        </v-dialog>
        <div :class="$vuetify.breakpoint.mobile ? 'd-flex justify-center' : ''">
          <v-card
            :class="`side-panel pa-5 ${
              $vuetify.breakpoint.mobile ? '' : 'mr-7'
            }`"
          >
            <v-avatar class="mb-2" size="125" rounded>
              <img :src="getAvatar()" />
            </v-avatar>
            <div class="username mb-2" v-text="stranger.username" />
            <div class="d-flex justify-space-between">
              <v-dialog v-model="showAddPrompt" width="500">
                <template #activator="{ on, attrs }">
                  <v-btn
                    v-if="!disableAddBtn"
                    class="px-10"
                    color="green darken-2"
                    x-large
                    v-bind="attrs"
                    v-on="on"
                    v-text="'Add'"
                  />
                </template>
                <v-card class="text-center">
                  <v-card-title class="text-center" v-text="'Are you sure?'" />
                  <v-card-text>
                    By clicking "ADD" you agree to let the user you are chatting
                    with get your Discord username, discriminator and avatar if
                    they accept your request.
                  </v-card-text>
                  <v-card-text>
                    This is to give both users a way to continue chatting
                    outside of this service!
                  </v-card-text>
                  <v-divider />
                  <v-card-actions>
                    <v-spacer />
                    <v-btn
                      color="red darken-3"
                      @click="showAddPrompt = false"
                      v-text="'Cancel'"
                    />

                    <v-btn
                      color="green darken-2"
                      @click="addFriend()"
                      v-text="'Add'"
                    />
                  </v-card-actions>
                </v-card>
              </v-dialog>
              <v-tooltip v-if="disableAddBtn" top>
                <template #activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    class="px-10"
                    color="#7289DA"
                    v-on="on"
                    @click="
                      openInNewTab(`https://discord.com/users/${stranger.id}`)
                    "
                  >
                    <v-icon left v-text="icons.discord" />
                    Add
                  </v-btn>
                </template>
                <span>Add the user on Discord</span>
              </v-tooltip>
              <v-btn
                class="px-10"
                color="red darken-3"
                x-large
                @click="$router.push('/meet')"
                v-text="'Skip'"
              />
            </div>
          </v-card>
        </div>
      </v-col>
      <v-col md="8" lg="8" xl="8">
        <v-card flat>
          <div
            :class="`chat-container ${
              $vuetify.breakpoint.mobile ? 'mobile' : ''
            }`"
          >
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="message mb-2"
              :class="{ own: message.socketID === socketID }"
            >
              <div
                v-if="message.type === 'message'"
                class="content"
                v-text="message.content"
              />
              <div
                v-if="message.type === 'notification'"
                class="notification"
                v-text="message.content"
              />
            </div>
          </div>
          <v-row>
            <v-col xs="10" sm="10" md="10" lg="11" xl="11">
              <v-text-field
                v-model="inputMessage"
                class="px-3 pt-2"
                outlined
                autofocus
                :disabled="disableChat"
                :placeholder="disableChat ? 'User left' : 'Type a message...'"
                color="orange darken-2"
                clearable
                @keyup.enter="sendMessage"
              />
            </v-col>
            <v-btn
              :class="`mt-5 ${$vuetify.breakpoint.mobile ? 'mr-5' : ''} `"
              :disabled="!inputMessage.trim().length"
              icon
              color="orange darken-2"
              x-large
              @click="sendMessage"
            >
              <v-icon v-text="icons.send" />
            </v-btn>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { mdiSend } from '@mdi/js'
import Vue from 'vue'

export default Vue.extend({
  middleware: ['auth'],
  data() {
    return {
      DISCORD_CDN_BASE: process.env.DISCORD_CDN_BASE,
      socketID: '',
      roomID: this.$route.params.room,
      inputMessage: '',
      stranger: { username: 'Stranger', id: null, avatar: '' },
      messages: [],
      disableAddBtn: false,
      disableChat: false,
      showFriendReq: false,
      showAddPrompt: false,
      friendedStranger: false,
      receivedCommonInterests: false,
      icons: {
        send: mdiSend,
      },
    }
  },
  watch: {
    messages: 'scrollToLastMessage',
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      name: 'room',
      channel: '/room',
    })

    this.getSocketID()

    this.socket.on('getSocketID', ({ socketID }) => {
      this.socketID = socketID
      this.updateUser()
      this.joinedRoom()
    })

    this.socket.on('joinedRoom', ({ response }) => {
      if (response === 'Unauthorised') return this.$router.push('/meet')

      this.socket.join(this.roomID)
    })

    this.socket.on('userLeft', () => {
      this.disableAddBtn = true
      this.disableChat = true

      return this.$router.push('/meet')
    })

    this.socket.on('message', ({ msg }) => {
      this.messages.push(msg)
    })

    this.socket.on('notification', ({ type, user, interests }) => {
      const notification = {
        type: 'notification',
        content: '',
        socketID: user ? user.socketID : '',
      }

      switch (type) {
        case 'interests':
          notification.content = `You both are interested in: ${interests.join(
            ', '
          )}`

          if (!this.receivedCommonInterests) {
            this.messages.push(notification)
            this.receivedCommonInterests = true
          }

          break
      }
    })

    this.socket.on('friendRequest', () => {
      this.showFriendReq = true
    })

    this.socket.on('alreadyFriends', ({ user }) => {
      this.stranger.id = user.id
      this.stranger.username = user.username
      this.stranger.avatar = user.avatar

      this.disableAddBtn = true
    })

    this.socket.on('acceptedFriend', ({ user }) => {
      this.stranger.id = user.id
      this.stranger.username = user.username
      this.stranger.avatar = user.avatar

      if (!this.friendedStranger) this.acceptedFriend()
    })

    this.socket.on('rejectedFriend', () => {
      this.disableAddBtn = false
    })
  },
  methods: {
    openInNewTab(link: string) {
      window.open(link, '_blank')
    },
    joinedRoom() {
      this.socket.emit('joinedRoom', {
        user: this.getUser(),
        room: this.roomID,
      })
    },
    updateUser() {
      this.socket.emit('updateUser', {
        user: this.getUser(),
      })
    },
    getSocketID() {
      this.socket.emit('getSocketID')
    },
    getUser() {
      return {
        id: this.$auth.user.id,
        username: `${this.$auth.user.username}#${this.$auth.user.discriminator}`,
        avatar: this.$auth.user.avatar,
        socketID: this.socketID,
      }
    },
    sendMessage(): any {
      if (!this.inputMessage) return

      const message = {
        type: 'message',
        date: new Date(),
        roomID: this.roomID,
        userID: this.getUser().id,
        socketID: this.socketID,
        username: this.getUser().username,
        content: this.inputMessage,
      }

      this.socket.emit('message', { message })

      this.inputMessage = ''
    },
    addFriend() {
      this.showAddPrompt = false
      this.disableAddBtn = true

      this.socket.emit('friendRequest', {
        user: this.getUser(),
        room: this.roomID,
      })
    },
    acceptedFriend() {
      this.showFriendReq = false
      this.friendedStranger = true
      this.disableAddBtn = true

      this.socket.emit('acceptedFriend', {
        user: this.getUser(),
        room: this.roomID,
      })
    },
    rejectedFriend() {
      this.showFriendReq = false

      this.socket.emit('rejectedFriend', {
        userID: this.getUser().id,
        room: this.roomID,
      })
    },
    getAvatar() {
      const user = this.stranger

      if (user.avatar) {
        return `${this.DISCORD_CDN_BASE}/avatars/${user.id}/${user.avatar}.${
          user.avatar.startsWith('a_') ? 'gif' : 'png'
        }`
      }

      return `/images/stranger-avatar-${this.$auth.$state.theme.toLowerCase()}-placeholder.png`
    },
    scrollToLastMessage() {
      const chatContainer = this.$el.getElementsByClassName('chat-container')[0]
      const lastMessage = chatContainer.lastElementChild

      if (lastMessage) {
        lastMessage.scrollIntoView({ block: 'end' })
      }
    },
  },
})
</script>

<style>
.side-panel {
  text-align: center;
}

.side-panel .username {
  font-size: 22px;
  font-weight: bold;
}

.message.own {
  text-align: right;
}

.message.own .content {
  background-color: orange;
}

.chat-container {
  box-sizing: border-box;
  height: calc(100vh - 15rem);
  overflow-y: auto;
  padding: 10px;
}

.chat-container.mobile {
  height: calc(100vh - 30rem);
}

.chat-container .username {
  font-size: 16px;
}

.chat-container .content {
  padding: 4px;
  background-color: gray;
  border-radius: 10px;
  display: inline-block;
  max-width: 50%;
  word-wrap: break-word;
}

.notification {
  padding-top: 5px;
  padding-bottom: 5px;
  text-align: center;
  color: rgb(148, 148, 148);
}
</style>
