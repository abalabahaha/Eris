"use strict";

const Interaction = require("./Interaction");
const Member = require("./Member");
const User = require("./User");
const Role = require("./Role");
const Channel = require("./Channel");
const Message = require("./Message");
const {InteractionResponseTypes} = require("../Constants");

/**
* Represents an application command interaction. See Interaction for more properties.
* @extends Interaction
* @prop {String} channelID The ID of the channel in which the interaction was created
* @prop {Object} data The data attached to the interaction
* @prop {String} data.id The ID of the Application Command
* @prop {String} data.name The command name
* @prop {Number} data.type The [command type](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types)
* @prop {String?} data.target_id The id the of user or message targetted by a context menu command
* @prop {Array<Object>?} data.options The run Application Command options
* @prop {String} data.options.name The name of the Application Command option
* @prop {Number} data.options.type Command option type, 1-10
* @prop {Number?} data.options.value The value of the run Application Command (Mutually exclusive with options)
* @prop {Array<Object>?} data.options.options The run Application Command options (Mutually exclusive with value)
* @prop {Object?} data.resolved converted users + roles + channels
* @prop {Map<String, User>?} data.resolved.users converted users
* @prop {Map<String, Member>?} data.resolved.members converted members
* @prop {Map<String, Role>?} data.resolved.roles converted roles
* @prop {Map<String, Channel>?} data.resolved.channels converted channels
* @prop {String?} guildID The ID of the guild in which the interaction was created
* @prop {Member?} member The member who triggered the interaction (This is only sent when the interaction is invoked within a guild)
* @prop {User?} user The user who triggered the interaction (This is only sent when the interaction is invoked within a dm)
*/
class CommandInteraction extends Interaction {
    constructor(info, client) {
        super(info, client);

        if(info.channel_id !== undefined) {
            this.channelID = info.channel_id;
        }

        this.data = info.data;

        if(info.data.resolved !== undefined) {
            //Users
            if(info.data.resolved.users !== undefined) {
                Array.from(info.data.resolved.users).forEach((user, id) => {
                    this.data.resolved.users.set(id, new User(user, this._client));
                });
            }
            //Members
            if(info.data.resolved.members !== undefined) {
                Array.from(info.data.resolved.members).forEach((member, id) => {
                    this.data.resolved.members.set(id, new Member(member, this._client));
                });
            }
            //Roles
            if(info.data.resolved.roles !== undefined) {
                this.Array.from(info.data.resolved.roles).forEach((role, id) => {
                    this.data.resolved.roles.set(id, new Role(role, this._client));
                });
            }
            //Channels
            if(info.data.resolved.channels !== undefined) {
                Array.from(info.data.resolved.channels).forEach((channel, id) => {
                    this.data.resolved.channels.set(id, new Channel(channel, this._client));
                });
            }
            //Messages
            if(info.data.resolved.messages !== undefined) {
                Array.from(info.data.resolved.messages).forEach((message, id) => {
                    this.data.resolved.messages.set(id, new Message(message, this._client));
                });
            }
        }

        /*if(info.data.target_id !== undefined) {
            this.data.target_id = undefined;
            this.data.targetID = info.data.target_id;
        }*/

        if(info.guild_id !== undefined) {
            this.guildID = info.guild_id;
        }

        if(info.member !== undefined) {
            this.member = new Member(info.member, client.guilds.get(info.guild_id), this._client);
        }

        if(info.user !== undefined) {
            this.user = new User(info.user, this._client);
        }

    }

    /**
    * Acknowledges the interaction with a defer response
    * Note: You can **not** use more than 1 initial interaction response per interaction.
    * @arg {Number} [flags] 64 for Ephemeral
    * @returns {Promise}
    */
    async acknowledge(flags) {
        if(this.acknowledged === true) {
            throw new Error("You have already acknowledged this interaction.");
        }
        return this._client.createInteractionResponse.call(this._client, this.id, this.token, {
            type: InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: flags || 0
            }
        }).then(() => this.update());
    }

    /**
    * Respond to the interaction with a followup message
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {String} content.content A content string
    * @arg {Object} [content.embeds] An array of up to 10 embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Number} [content.flags] 64 for Ephemeral
    * @arg {Object | Array<Object>} [content.file] A file object (or an Array of them)
    * @arg {Buffer} content.file.file A buffer containing file data
    * @arg {String} content.file.name What to name the file
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @returns {Promise<Message?>}
    */
    async createFollowup(content) {
        if(this.acknowledged === false) {
            throw new Error("createFollowup cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
        }
        return this._client.executeWebhook.call(this._client, this.applicationID, this.token, Object.assign({wait: true}, content));
    }

    /**
    * Acknowledges the interaction with a message. If already acknowledged runs createFollowup
    * Note: You can **not** use more than 1 initial interaction response per interaction, use createFollowup if you have already responded with a different interaction response.
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {String} content.content A content string
    * @arg {Object} [content.embeds] An array of up to 10 embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Number} [content.flags] 64 for Ephemeral
    * @arg {Object | Array<Object>} [content.file] (Only applies after the interaction is acknowledged.) A file object (or an Array of them)
    * @arg {Buffer} content.file.file A buffer containing file data
    * @arg {String} content.file.name What to name the file
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @returns {Promise}
    */
    async createMessage(content) {
        if(this.acknowledged === true) {
            return this.createFollowup(content);
        }
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            } else if(content.content === undefined && !content.embeds) {
                return Promise.reject(new Error("No content or embeds"));
            }
            if(content.content !== undefined || content.embeds || content.allowedMentions) {
                content.allowed_mentions = this._client._formatAllowedMentions(content.allowedMentions);
            }
        }
        return this._client.createInteractionResponse.call(this._client, this.id, this.token, {
            type: InteractionResponseTypes.CHANNEL_MESSAGE_WITH_SOURCE,
            data: content
        }).then(() => this.update());
    }

    /**
    * Acknowledges the interaction with a defer response
    * Note: You can **not** use more than 1 initial interaction response per interaction.
    * @arg {Number} [flags] 64 for Ephemeral
    * @returns {Promise}
    */
    async defer(flags) {
        if(this.acknowledged === true) {
            throw new Error("You have already acknowledged this interaction.");
        }
        return this._client.createInteractionResponse.call(this._client, this.id, this.token, {
            type: InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: flags || 0
            }
        }).then(() => this.update());
    }

    /**
    * Delete a message
    * @arg {String} messageID the id of the message to delete, or "@original" for the original response.
    * @returns {Promise}
    */
    async deleteMessage(messageID) {
        if(this.acknowledged === false) {
            throw new Error("deleteMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        return this._client.deleteWebhookMessage.call(this._client, this.applicationID, this.token, messageID);
    }

    /**
    * Delete the Original message
    * Warning: Will error with ephemeral messages.
    * @returns {Promise}
    */
    async deleteOriginalMessage() {
        if(this.acknowledged === false) {
            throw new Error("deleteOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        return this._client.deleteWebhookMessage.call(this._client, this.applicationID, this.token, "@original");
    }

    /**
    * Edit a message
    * @arg {String} messageID the id of the message to edit, or "@original" for the original response.
    * @arg {Object} options Interaction message edit options
    * @arg {Object} [options.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [options.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [options.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [options.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Boolean} [options.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
    * @arg {String} [options.content=""] A content string
    * @arg {Object} [content.embeds] An array of up to 10 embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object | Array<Object>} [options.file] A file object (or an Array of them)
    * @arg {Buffer} options.file.file A buffer containing file data
    * @arg {String} options.file.name What to name the file
    * @returns {Promise<Message>}
    */
    async editMessage(messageID, content) {
        if(this.acknowledged === false) {
            throw new Error("editMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
        }
        return this._client.editWebhookMessage.call(this._client, this.applicationID, this.token, messageID, content);
    }

    /**
    * Edit the Original response message
    * @arg {Object} options Interaction message edit options
    * @arg {Object} [options.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [options.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [options.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [options.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Boolean} [options.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
    * @arg {String} [options.content=""] A content string
    * @arg {Object} [content.embeds] An array of up to 10 embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object | Array<Object>} [options.file] A file object (or an Array of them)
    * @arg {Buffer} options.file.file A buffer containing file data
    * @arg {String} options.file.name What to name the file
    * @returns {Promise<Message>}
    */
    async editOriginalMessage(content) {
        if(this.acknowledged === false) {
            throw new Error("editOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
        }
        return this._client.editWebhookMessage.call(this._client, this.applicationID, this.token, "@original", content);
    }

    /**
    * Get the Original response message
    * Warning: Will error with ephemeral messages.
    * @returns {Promise<Message>}
    */
    async getOriginalMessage() {
        if(this.acknowledged === false) {
            throw new Error("getOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        return this._client.getWebhookMessage.call(this._client, this.applicationID, this.token, "@original");
    }

}

module.exports = CommandInteraction;
