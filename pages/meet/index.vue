<template>
  <div>
    <div v-if="inQueue" class="display-1 text-center mt-10">
      Waiting for other users to join the queue...
    </div>
    <div v-if="!inQueue">
      <v-container fluid>
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
                      :disabled="joinQueueDisabled"
                      color="green darken-2"
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
      </v-container>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  middleware: ['auth'],
  data() {
    return {
      inQueue: false,
      socketID: '',
      interests: [],
      joinQueueDisabled: true,
      interestsRules: [
        (interests: string[]) =>
          interests.length < 6 || 'You can only choose up to 5 interests!',
        (interests: string[]) =>
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
          interests.every(
            (interest) => !new RegExp(/([^A-Za-z0-9 ])/g).test(interest)
          ) || 'You can only use alphanumerical values!',
        (interests: string[]) =>
          interests.every((interest) => interest.length >= 3) ||
          'Interests need to be at least 3 characters long.',
      ],
      validInterests: false,
      autoJoin: false,
      autoJoinTimer: 5,
      countdownID: null,
      countdownStarted: false,
    }
  },
  watch: {
    autoJoin(newVal, oldVal) {
      if (this.countdownStarted && newVal) return
      if (newVal) {
        this.countdownStarted = true
        this.countdownID = setInterval(() => {
          if (this.autoJoinTimer > 0) {
            this.autoJoinTimer--
          } else if (this.autoJoinTimer === 0) {
            clearInterval(this.countdownID!)
            this.addToQueue()
          }
        }, 1000)
      } else {
        clearInterval(this.countdownID!)
        this.countdownStarted = false
        this.autoJoinTimer = 5
      }
    },
    validInterests: 'canJoinQueue',
    socketID: 'canJoinQueue',
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      name: 'queue',
      channel: '/queue',
    })

    this.interests = this.$store.state.interests
    this.autoJoin = this.$store.state.autoJoin

    this.socket.on('joinRoom', ({ route }) => {
      this.$router.push(`/meet/${route}`)
    })

    this.getSocketID()

    this.socket.on('getSocketID', ({ socketID }) => {
      this.socketID = socketID

      this.updateUser()
    })

    this.socket.on('alreadyInRoom', () => this.$router.push('/'))
  },
  methods: {
    updateUser() {
      this.socket.emit('updateUser', {
        user: this.getUser(),
      })
    },
    addToQueue() {
      this.socket.emit('addToQueue', {
        user: this.getUser(),
        interests: this.interests,
      })

      this.inQueue = true
      this.$store.commit('setInterests', this.interests)
      this.$store.commit('setAutoJoin', this.autoJoin)
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
    canJoinQueue() {
      if (this.socketID && !this.validInterests)
        return (this.joinQueueDisabled = true)

      return (this.joinQueueDisabled = false)
    },
  },
})
</script>
