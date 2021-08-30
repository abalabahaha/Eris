import Eris from "./index.js";

export default function(token, options) {
  return new Eris.Client(token, options);
}

export const {
  Base,
  Bucket,
  Call,
  CategoryChannel,
  Channel,
  Client,
  Collection,
  Command,
  CommandClient,
  CommandInteraction,
  ComponentInteraction,
  Constants,
  DiscordHTTPError,
  DiscordRESTError,
  ExtendedUser,
  GroupChannel,
  Guild,
  GuildChannel,
  GuildIntegration,
  GuildPreview,
  GuildTemplate,
  Interaction,
  Invite,
  Member,
  Message,
  NewsChannel,
  Permission,
  PermissionOverwrite,
  PingInteraction,
  PrivateChannel,
  Relationship,
  RequestHandler,
  Role,
  SequentialBucket,
  Shard,
  SharedStream,
  StoreChannel,
  TextChannel,
  UnavailableGuild,
  UnknownInteraction,
  User,
  VERSION,
  VoiceChannel,
  VoiceConnection,
  VoiceConnectionManager,
  VoiceState
} = Eris;
