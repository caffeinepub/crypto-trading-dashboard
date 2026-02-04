import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Principal "mo:core/Principal";

import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type SignalStrength = {
    #strongBuy;
    #buy;
    #hold;
    #sell;
    #strongSell;
  };

  type RiskReward = {
    riskRewardRatio : Float;
    positionSize : Float;
    stopLoss : Float;
    takeProfit : Float;
  };

  type Position = {
    id : Nat;
    portfolioId : Nat;
    userId : Principal;
    asset : Text;
    buyPrice : Float;
    sellPrice : ?Float;
    quantity : Float;
    signalStrength : SignalStrength;
    stopLoss : ?Float;
    takeProfit : ?Float;
  };

  type Strategy = {
    id : Nat;
    userId : ?Principal;
    name : Text;
    description : Text;
    performance : Text;
    code : Text;
  };

  type Backtest = {
    id : Nat;
    strategyId : Nat;
    userId : Principal;
    performance : Text;
    results : Text;
    createdAt : Time.Time;
    updatedAt : ?Time.Time;
  };

  type TradeJournalEntry = {
    id : Nat;
    userId : Principal;
    positionId : Nat;
    outcome : Text;
    notes : Text;
    entryTime : Time.Time;
    exitTime : ?Time.Time;
    pnl : Float;
  };

  type CryptoInsight = {
    id : Nat;
    symbol : Text;
    price : Float;
    percentChange : Float;
    signalStrength : SignalStrength;
    createdAt : Time.Time;
    updatedAt : ?Time.Time;
  };

  type PortfolioSummary = {
    totalInvested : Float;
    totalSold : Float;
    cryptoCount : Nat;
    positionCount : Nat;
    tradeCount : Nat;
    realized : Float;
    profit : Float;
    totalClosedGain : Float;
    openProfit : Float;
    gainTotal : Float;
    totalCrypto : Text;
    biggestLossCrypto : Text;
    loserCryptoCount : Nat;
    losers : Nat;
    winnerCryptoCount : Nat;
    winners : Nat;
    biggestWinner : Text;
    biggestPosition : Text;
    strongBuy : Nat;
    buy : Nat;
    hold : Nat;
    sell : Nat;
    strongSell : Nat;
    pointFormerStrongBuy : Nat;
    pointFormerBuy : Nat;
    pointFormerHold : Nat;
    pointFormerSell : Nat;
    pointFormerStrongSell : Nat;
    pointFormerWeakBuy : Nat;
    pointFormerWeakSell : Nat;
    formerStrongBuy : Nat;
    formerBuy : Nat;
    formerSell : Nat;
    formerStrongSell : Nat;
    winnerProfitUSD : Float;
    winnerRewardScore : Float;
    pointFormerWinners : Nat;
    pointFormerWinnerOpenROI : Float;
    pointFormerWinnerROI : Float;
    pointFormerWinnerOpportunities : Nat;
    pointFormerWinnerScore : Float;
    pointFormerWinnerUSD : Float;
    winnerOpportunities : Nat;
  };

  public type UserProfile = {
    name : Text;
    riskTolerance : ?Float;
    preferredTimeframe : ?Text;
  };

  type ReadyToDumpSignal = {
    id : Nat;
    symbol : Text;
    timeframe : Text;
    signalStrength : SignalStrength;
    confidenceScore : Float;
    entryZone : Float;
    takeProfitZone : Float;
    stopLossZone : Float;
    createdAt : Time.Time;
    updatedAt : ?Time.Time;
  };

  type Settings = {
    aiForecastSensitivity : Float;
    alertThreshold : Float;
    riskTolerance : Float;
    preferredTimeframes : [Text];
    confidenceLevel : Float;
    enablePerformanceMode : Bool;
    enableBrowserNotifications : Bool;
    enableAudioAlerts : Bool;
    enableToastNotifications : Bool;
    enableTimeframeSync : Bool;
    displayUiTheme : Text;
  };

  let defaultSettings : Settings = {
    aiForecastSensitivity = 1.0;
    alertThreshold = 60.0;
    riskTolerance = 2.0;
    preferredTimeframes = ["1h", "4h", "1d"];
    confidenceLevel = 60.0;
    enablePerformanceMode = false;
    enableBrowserNotifications = true;
    enableAudioAlerts = true;
    enableToastNotifications = true;
    enableTimeframeSync = true;
    displayUiTheme = "ugc_theme_light";
  };

  let positions = Map.empty<Nat, Position>();
  let strategies = Map.empty<Nat, Strategy>();
  let backtests = Map.empty<Nat, Backtest>();
  let tradeJournal = Map.empty<Nat, TradeJournalEntry>();
  let cryptoInsights = Map.empty<Nat, CryptoInsight>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let readyToDumpSignals = Map.empty<Nat, ReadyToDumpSignal>();
  let userSettings = Map.empty<Principal, Settings>();
  var riskReward : ?RiskReward = null;
  var portfolioSummary : ?PortfolioSummary = null;

  // Access Control Guards
  func guardAdmin(caller : Principal) : () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin privileges required");
    };
  };

  func guardUser(caller : Principal) : () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: User privileges required");
    };
  };

  func guardPositionOwner(caller : Principal, positionId : Nat) : () {
    switch (positions.get(positionId)) {
      case null { Runtime.trap("Position not found") };
      case (?position) {
        if (position.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own positions");
        };
      };
    };
  };

  func guardStrategyOwner(caller : Principal, strategyId : Nat) : () {
    switch (strategies.get(strategyId)) {
      case null { Runtime.trap("Strategy not found") };
      case (?strategy) {
        if (strategy.userId != ?caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own strategies");
        };
      };
    };
  };

  func guardBacktestOwner(caller : Principal, backtestId : Nat) : () {
    switch (backtests.get(backtestId)) {
      case null { Runtime.trap("Backtest not found") };
      case (?backtest) {
        if (backtest.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own backtests");
        };
      };
    };
  };

  func guardJournalEntryOwner(caller : Principal, entryId : Nat) : () {
    switch (tradeJournal.get(entryId)) {
      case null { Runtime.trap("Journal entry not found") };
      case (?entry) {
        if (entry.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own journal entries");
        };
      };
    };
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    guardUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    guardUser(caller);
    userProfiles.add(caller, profile);
  };

  // Ready to Dump Signal Functions
  public shared ({ caller }) func createReadyToDumpSignal(symbol : Text, timeframe : Text, signalStrength : SignalStrength, confidenceScore : Float, entryZone : Float, takeProfitZone : Float, stopLossZone : Float) : async Nat {
    guardAdmin(caller);
    let id = readyToDumpSignals.size() + 1;
    let signal : ReadyToDumpSignal = {
      id;
      symbol;
      timeframe;
      signalStrength;
      confidenceScore;
      entryZone;
      takeProfitZone;
      stopLossZone;
      createdAt = Time.now();
      updatedAt = null;
    };
    readyToDumpSignals.add(id, signal);
    id;
  };

  public shared ({ caller }) func updateReadyToDumpSignal(signalId : Nat, timeframe : Text, signalStrength : SignalStrength, confidenceScore : Float, entryZone : Float, takeProfitZone : Float, stopLossZone : Float) : async () {
    guardAdmin(caller);
    switch (readyToDumpSignals.get(signalId)) {
      case null { Runtime.trap("Ready to Dump signal not found") };
      case (?signal) {
        let updated : ReadyToDumpSignal = {
          id = signal.id;
          symbol = signal.symbol;
          timeframe = timeframe;
          signalStrength = signalStrength;
          confidenceScore = confidenceScore;
          entryZone = entryZone;
          takeProfitZone = takeProfitZone;
          stopLossZone = stopLossZone;
          createdAt = signal.createdAt;
          updatedAt = ?Time.now();
        };
        readyToDumpSignals.add(signalId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteReadyToDumpSignal(signalId : Nat) : async () {
    guardAdmin(caller);
    readyToDumpSignals.remove(signalId);
  };

  public query ({ caller }) func getAllReadyToDumpSignals() : async [ReadyToDumpSignal] {
    readyToDumpSignals.values().toArray();
  };

  public query ({ caller }) func getActiveReadyToDumpSignals() : async [ReadyToDumpSignal] {
    readyToDumpSignals.values().toArray().filter(
      func(signal) {
        let now = Time.now();
        let signalAge = now - signal.createdAt;
        signalAge < 86400000000000;
      }
    );
  };

  // User Settings Functions
  public query ({ caller }) func getUserSettings() : async Settings {
    switch (userSettings.get(caller)) {
      case (null) { defaultSettings };
      case (?userSettings) { userSettings };
    };
  };

  public shared ({ caller }) func saveUserSettings(settings : Settings) : async () {
    guardUser(caller);
    userSettings.add(caller, settings);
  };

  public shared ({ caller }) func resetUserSettings() : async () {
    guardUser(caller);
    userSettings.add(caller, defaultSettings);
  };

  public query ({ caller }) func getDefaultSettings() : async Settings {
    defaultSettings;
  };

  // Position Functions (User-owned resources)
  public shared ({ caller }) func createPosition(portfolioId : Nat, asset : Text, buyPrice : Float, quantity : Float, signalStrength : SignalStrength) : async Nat {
    guardUser(caller);
    if (asset.isEmpty()) {
      Runtime.trap("Asset symbol cannot be empty");
    };
    if (buyPrice <= 0.0 or quantity <= 0.0) {
      Runtime.trap("Buy price and quantity must be positive");
    };
    let id = positions.size() + 1;
    let position : Position = {
      id;
      portfolioId;
      userId = caller;
      asset;
      buyPrice;
      sellPrice = null;
      quantity;
      signalStrength;
      stopLoss = null;
      takeProfit = null;
    };
    positions.add(id, position);
    id;
  };

  public shared ({ caller }) func updatePosition(positionId : Nat, sellPrice : ?Float, stopLoss : ?Float, takeProfit : ?Float) : async () {
    guardPositionOwner(caller, positionId);
    switch (positions.get(positionId)) {
      case null { Runtime.trap("Position not found") };
      case (?position) {
        let updated : Position = {
          id = position.id;
          portfolioId = position.portfolioId;
          userId = position.userId;
          asset = position.asset;
          buyPrice = position.buyPrice;
          sellPrice = sellPrice;
          quantity = position.quantity;
          signalStrength = position.signalStrength;
          stopLoss = stopLoss;
          takeProfit = takeProfit;
        };
        positions.add(positionId, updated);
      };
    };
  };

  public shared ({ caller }) func deletePosition(positionId : Nat) : async () {
    guardPositionOwner(caller, positionId);
    positions.remove(positionId);
  };

  public query ({ caller }) func getAllPositions() : async [Position] {
    positions.values().toArray();
  };

  public query ({ caller }) func getPositionsByPortfolio(portfolioId : Nat) : async [Position] {
    positions.values().toArray().filter(func(pos) { pos.portfolioId == portfolioId });
  };

  public query ({ caller }) func getUserPositions() : async [Position] {
    guardUser(caller);
    positions.values().toArray().filter(func(pos) { pos.userId == caller });
  };

  // Strategy Functions (User-owned resources)
  public shared ({ caller }) func createStrategy(name : Text, description : Text, performance : Text, code : Text) : async Nat {
    guardUser(caller);
    if (name.isEmpty()) {
      Runtime.trap("Strategy name cannot be empty");
    };
    let id = strategies.size() + 1;
    let strategy : Strategy = {
      id;
      userId = ?caller;
      name;
      description;
      performance;
      code;
    };
    strategies.add(id, strategy);
    id;
  };

  public shared ({ caller }) func updateStrategy(strategyId : Nat, name : Text, description : Text, performance : Text, code : Text) : async () {
    guardStrategyOwner(caller, strategyId);
    switch (strategies.get(strategyId)) {
      case null { Runtime.trap("Strategy not found") };
      case (?strategy) {
        let updated : Strategy = {
          id = strategy.id;
          userId = strategy.userId;
          name = name;
          description = description;
          performance = performance;
          code = code;
        };
        strategies.add(strategyId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteStrategy(strategyId : Nat) : async () {
    guardStrategyOwner(caller, strategyId);
    strategies.remove(strategyId);
  };

  public query ({ caller }) func getAllStrategies() : async [Strategy] {
    strategies.values().toArray();
  };

  public query ({ caller }) func getStrategy(id : Nat) : async ?Strategy {
    strategies.get(id);
  };

  public query ({ caller }) func getStrategyCode(id : Nat) : async ?Text {
    strategies.get(id).map(func(strategy) { strategy.code });
  };

  public query ({ caller }) func getUserStrategies() : async [Strategy] {
    guardUser(caller);
    strategies.values().toArray().filter(func(s) { s.userId == ?caller });
  };

  // Backtest Functions (User-owned resources)
  public shared ({ caller }) func createBacktest(strategyId : Nat, performance : Text, results : Text) : async Nat {
    guardUser(caller);
    guardStrategyOwner(caller, strategyId);
    let id = backtests.size() + 1;
    let backtest : Backtest = {
      id;
      strategyId;
      userId = caller;
      performance;
      results;
      createdAt = Time.now();
      updatedAt = null;
    };
    backtests.add(id, backtest);
    id;
  };

  public shared ({ caller }) func updateBacktest(backtestId : Nat, performance : Text, results : Text) : async () {
    guardBacktestOwner(caller, backtestId);
    switch (backtests.get(backtestId)) {
      case null { Runtime.trap("Backtest not found") };
      case (?backtest) {
        let updated : Backtest = {
          id = backtest.id;
          strategyId = backtest.strategyId;
          userId = backtest.userId;
          performance = performance;
          results = results;
          createdAt = backtest.createdAt;
          updatedAt = ?Time.now();
        };
        backtests.add(backtestId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteBacktest(backtestId : Nat) : async () {
    guardBacktestOwner(caller, backtestId);
    backtests.remove(backtestId);
  };

  public query ({ caller }) func getAllBacktests() : async [Backtest] {
    backtests.values().toArray();
  };

  public query ({ caller }) func getUserBacktests() : async [Backtest] {
    guardUser(caller);
    backtests.values().toArray().filter(func(b) { b.userId == caller });
  };

  // Trade Journal Functions (User-owned resources)
  public shared ({ caller }) func createTradeJournalEntry(positionId : Nat, outcome : Text, notes : Text, exitTime : ?Time.Time, pnl : Float) : async Nat {
    guardUser(caller);
    guardPositionOwner(caller, positionId);
    let id = tradeJournal.size() + 1;
    let entry : TradeJournalEntry = {
      id;
      userId = caller;
      positionId;
      outcome;
      notes;
      entryTime = Time.now();
      exitTime = exitTime;
      pnl = pnl;
    };
    tradeJournal.add(id, entry);
    id;
  };

  public shared ({ caller }) func updateTradeJournalEntry(entryId : Nat, outcome : Text, notes : Text, exitTime : ?Time.Time, pnl : Float) : async () {
    guardJournalEntryOwner(caller, entryId);
    switch (tradeJournal.get(entryId)) {
      case null { Runtime.trap("Journal entry not found") };
      case (?entry) {
        let updated : TradeJournalEntry = {
          id = entry.id;
          userId = entry.userId;
          positionId = entry.positionId;
          outcome = outcome;
          notes = notes;
          entryTime = entry.entryTime;
          exitTime = exitTime;
          pnl = pnl;
        };
        tradeJournal.add(entryId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteTradeJournalEntry(entryId : Nat) : async () {
    guardJournalEntryOwner(caller, entryId);
    tradeJournal.remove(entryId);
  };

  public query ({ caller }) func getAllTradeJournalEntries() : async [TradeJournalEntry] {
    guardUser(caller);
    tradeJournal.values().toArray().filter(func(e) { e.userId == caller });
  };

  public query ({ caller }) func getUserTradeJournalEntries() : async [TradeJournalEntry] {
    guardUser(caller);
    tradeJournal.values().toArray().filter(func(e) { e.userId == caller });
  };

  // Market Data Functions
  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func fetchCryptoDataFromBinance() : async Text {
    await OutCall.httpGetRequest(
      "https://api.binance.com/api/v3/ticker/24hr",
      [],
      transform,
    );
  };
};
