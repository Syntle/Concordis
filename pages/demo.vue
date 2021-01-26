<template>
  <v-container fluid>
    <!-- Interests -->
    <div v-if="activeComponent === 'interests'">
      <v-row justify="center">
        <v-col cols="8">
          <v-card>
            <v-row justify="center">
              <v-col cols="8">
                <v-card-text
                  class="text-center text-h6 orange--text text--darken-2"
                >
                  Join the Queue!
                </v-card-text>
                <v-card-text>
                  Enter your interests in the box below to get matched up with
                  users that have similar interests. Otherwise, you will be
                  randomly matched with a user.
                </v-card-text>
                <v-form v-model="validInterests" lazy-validation>
                  <v-combobox
                    v-model="interests"
                    :rules="interestsRules"
                    label="Interests"
                    class="mt-1"
                    color="orange darken-2"
                    clearable
                    multiple
                    outlined
                    chips
                    deletable-chips
                  />
                </v-form>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <div class="d-flex justify-center mb-1">
                  <v-btn
                    color="green darken-2"
                    :disabled="joinQueueDisabled"
                    @click="addToQueue()"
                  >
                    Join Queue
                  </v-btn>
                </div>
                <div class="d-flex justify-center mb-1">
                  <v-switch
                    v-model="autoJoin"
                    inset
                    :label="
                      autoJoin
                        ? `Auto Joining: ${autoJoinTimer}...`
                        : 'Auto Join'
                    "
                  />
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <!-- Queue -->
    <div v-if="activeComponent === 'queue'" class="display-1 text-center mt-10">
      Waiting for other users to join the queue...
    </div>
    <!-- Chat -->
    <div v-if="activeComponent === 'chat'">
      <v-row>
        <v-col cols="4">
          <v-card class="side-panel pa-5 mr-7">
            <v-avatar class="mb-2" size="125" rounded>
              <img src="/images/stranger-avatar-dark-placeholder.png" />
            </v-avatar>
              <div class="d-flex justify-space-between">
                <v-dialog v-model="showAddPrompt" width="500">
                  <template #activator="{ on, attrs }">
                    <v-btn
                      v-if="!friended"
                    x-large
                    v-bind="attrs"
                    v-on="on"
                  >
                    Add
                  </v-btn>
                </template>
                <v-card class="text-center">
                  <v-card-title class="text-center">Are you sure?</v-card-title>
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
                    <v-spacer></v-spacer>
                    <v-btn color="red darken-3" @click="showAddPrompt = false">
                      Cancel
                    </v-btn>
                    <v-btn color="green darken-2" @click="addFriend()">
                      Add
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
                <v-tooltip v-if="friended" top>
                  <template #activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      class="px-10"
                      color="#7289DA"
                      v-on="on"
                      @click="dummyAddSnackbar = true"
                    >
                      <v-icon left v-text="icons.discord" />
                      Add
                    </v-btn>
                  </template>
                  <span>Add the user on Discord</span>
                </v-tooltip>
                <v-snackbar v-model="dummyAddSnackbar" timeout="3000">
                  You can't add the dummy user
                  <template #action="{ attrs }">
                    <v-btn
                      color="red"
                      icon
                      v-bind="attrs"
                      @click="dummyAddSnackbar = false"
                    >
                      <v-icon v-text="icons.close" />
                    </v-btn>
                  </template>
                </v-snackbar>
            </div>
          </v-card>
        </v-col>
        <v-col cols="8">
          <v-card flat>
            <div class="chat-container">
              <div
                v-for="(message, index) in messages"
                :key="index"
                class="message mb-2"
                :class="{ own: !message.stranger }"
              >
                <div v-if="message.stranger" class="username">
                  <div
                    v-if="
                      message.type === 'message' &&
                      index > 0 &&
                      !messages[index - 1].stranger
                    "
                  >
                    {{ message.username }}
                  </div>
                  <div v-if="message.type === 'message' && index == 0">
                    {{ message.username }}
                  </div>
                </div>
                <div v-if="!message.stranger" class="username">
                  <div
                    v-if="
                      message.type === 'message' &&
                      index > 0 &&
                      messages[index - 1].stranger
                    "
                  >
                    {{ message.username }}
                  </div>
                  <div v-if="message.type === 'message' && index == 0">
                    {{ message.username }}
                  </div>
                </div>
                <div v-if="message.type === 'message'" class="content">
                  {{ message.content }}
                </div>
                <div
                  v-if="message.type === 'notification'"
                  class="notification"
                >
                  {{ message.content }}
                </div>
              </div>
            </div>
            <v-text-field
              v-model="inputMessage"
              class="px-3 pt-2"
              outlined
              autofocus
              color="orange darken-2"
              clearable
              @keyup.enter="sendMessage"
            />
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script lang="ts">
import { mdiClose, mdiDiscord, mdiSend } from '@mdi/js'
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      activeComponent: 'interests',
      joinQueueDisabled: false,
      interests: [],
      interestsRules: [
        (interests: string[]) =>
          interests.length < 6 || 'You can only choose up to 5 interests!',
        (interests: string[]) =>
          // @ts-ignore
          !this.interests.length ||
          (!!interests &&
            interests.length &&
            !interests.find((interest) => !interest.trim().length)) ||
          'Empty value interests are not valid!',
        (interests: string[]) =>
          !interests.filter(
            (v: string, i: number, array) => i !== array.indexOf(v.trim())
          ).length || 'The same tag can not be added more than once',
        (interests: string[]) =>
          interests.every((interest) => !/([^A-Za-z0-9 ])/g.test(interest)) ||
          'You can only use alphanumerical values!',
        (interests: string[]) =>
          interests.every((interest) => interest.length >= 3) ||
          'Interests need to be at least 3 characters long.',
      ],
      validInterests: false,
      autoJoin: false,
      autoJoinTimer: 5,
      countdownID: null,
      countdownStarted: false,
      username: 'You#0000',
      stranger: 'Stranger',
      messages: [],
      inputMessage: '',
      friended: false,
      showAddPrompt: false,
      dummyAddSnackbar: false,
      icons: {
        send: mdiSend,
        discord: mdiDiscord,
        close: mdiClose,
      },
    }
  },
  watch: {
    autoJoin(newVal) {
      if (this.countdownStarted && newVal) return
      if (newVal) {
        this.countdownStarted = true
        // @ts-ignore
        this.countdownID = setInterval(() => {
          if (this.autoJoinTimer > 0) {
            this.autoJoinTimer--
          } else if (this.autoJoinTimer === 0) {
            clearInterval(this.countdownID!)
            this.addToQueue()
            this.autoJoinTimer = 5
          }
        }, 1000)
      } else {
        clearInterval(this.countdownID!)
        this.countdownStarted = false
        this.autoJoinTimer = 5
      }
    },
    validInterests(newVal) {
      if (newVal) {
        this.joinQueueDisabled = false
      } else {
        this.joinQueueDisabled = true
      }
    },
    messages: 'scrollToLastMessage',
  },
  methods: {
    addToQueue() {
      this.activeComponent = 'queue'

      setTimeout(() => {
        this.activeComponent = 'chat'
        if (this.interests.length) {
          const interests = {
            type: 'notification',
            content: `You both are interested in: ${this.interests.join(', ')}`,
          }

          // @ts-ignore
          this.messages.push(interests)
        }
      }, 1500)
    },
    sendMessage(): any {
      if (!this.inputMessage) return

      if (!this.inputMessage.trim().length) {
        this.inputMessage = ''
        return
      }

      const userMessage = {
        type: 'message',
        date: new Date(),
        stranger: false,
        username: this.username,
        content: this.inputMessage,
      }

      // @ts-ignore
      this.messages.push(userMessage)

      setTimeout(() => {
        const strangerMessage = {
          type: 'message',
          date: new Date(),
          stranger: true,
          username: this.stranger,
          content: userMessage.content,
        }

        // @ts-ignore
        this.messages.push(strangerMessage)
      }, 2000)

      this.inputMessage = ''
    },
    scrollToLastMessage() {
      const chatContainer = this.$el.getElementsByClassName('chat-container')[0]
      const lastMessage = chatContainer.lastElementChild

      if (lastMessage) {
        lastMessage.scrollIntoView({ block: 'end' })
      }
    },
    addFriend() {
      this.showAddPrompt = false
      this.friended = true

      this.stranger = 'Me#1111'
    },
    skip() {
      this.activeComponent = 'interests'
      this.messages = []
      this.stranger = 'Stranger'
      this.inputMessage = ''
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
  height: calc(100vh - 10rem);
  overflow-y: auto;
  padding: 10px;
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
