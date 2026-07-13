import { SafeAreaView } from "react-native-safe-area-context";
import React, {
  useState,
  useEffect,
  useContext,
} from "react";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { LanguageContext } from "../context/LanguageContext";
import { BASE_URL } from "../config";

export default function ViolationsScreen({ navigation }) {

  const { language } =
    useContext(LanguageContext);

  const translations = {

    EN: {

      title: "Violations",

      search: "Search Violation",

      all: "All",

      fine: "Fine",

      warning: "Warning",

      court: "Court",

      records: "Records",

      loading: "Loading...",

    },

    SI: {

      title: "වරදි",

      search: "වරදි සොයන්න",

      all: "සියල්ල",

      fine: "දඩ",

      warning: "අවවාද",

      court: "අධිකරණ",

      records: "වාර්තා",

      loading: "පූරණය වෙමින්...",

    },

  };

  const t = translations[language];

  const [selectedFilter, setSelectedFilter] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [violations, setViolations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadViolations();

  }, []);

  const loadViolations = async () => {

    try {

      const response =
        await fetch(
          `${BASE_URL}/violations`
        );

      const data =
        await response.json();

      setViolations(data);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  };

  const filteredData =
    violations.filter((item) => {

      const status =
        item.status || "";

      const driver =
        item.driver || "";

      const vehicle =
        item.vehicle || "";

      const location =
        item.location || "";

      const violation =
        item.violationType || "";

      const matchFilter =

        selectedFilter === "All" ||

        status === selectedFilter;

      const matchSearch =

        driver
          .toLowerCase()
          .includes(search.toLowerCase())

        ||

        vehicle
          .toLowerCase()
          .includes(search.toLowerCase())

        ||

        location
          .toLowerCase()
          .includes(search.toLowerCase())

        ||

        violation
          .toLowerCase()
          .includes(search.toLowerCase());

      return (
        matchFilter &&
        matchSearch
      );

    });

  if (loading) {

    return (

      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >

        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          {t.loading}
        </Text>

      </SafeAreaView>

    );

  }

    return (

    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <Text style={styles.headerText}>
          {t.title}
        </Text>

        <View style={{ flexDirection: "row" }}>

          <Ionicons
            name="notifications-outline"
            size={22}
            color="#fff"
            style={{ marginRight: 15 }}
            onPress={() =>
              navigation.navigate("Notifications")
            }
          />

          <Ionicons
            name="person-circle-outline"
            size={26}
            color="#fff"
            onPress={() =>
              navigation.navigate("Profile")
            }
          />

        </View>

      </View>

      {/* SEARCH */}

      <View style={styles.searchRow}>

        <TextInput
          placeholder={t.search}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("AddViolation")
          }
        >

          <Ionicons
            name="add-circle"
            size={34}
            color="#1e3a8a"
          />

        </TouchableOpacity>

      </View>

      {/* FILTERS */}

      <View style={styles.filterRow}>

        {[
          "All",
          "Pending",
          "Paid",
        ].map((item) => (

          <TouchableOpacity
            key={item}
            style={[
              styles.filterBtn,
              selectedFilter === item &&
                styles.activeFilter,
            ]}
            onPress={() =>
              setSelectedFilter(item)
            }
          >

            <Text
              style={{
                color:
                  selectedFilter === item
                    ? "#fff"
                    : "#000",
                fontWeight: "600",
              }}
            >

              {item}

            </Text>

          </TouchableOpacity>

        ))}

      </View>

      {/* RECORD COUNT */}

      <Text style={styles.count}>

        {filteredData.length} {t.records}

      </Text>

      {/* LIST */}

      <FlatList

        data={filteredData}

        keyExtractor={(item) => item._id}

        showsVerticalScrollIndicator={false}

        contentContainerStyle={{
          paddingBottom: 25,
        }}

        renderItem={({ item }) => (

          <View style={styles.card}>

            <Text style={styles.title}>

              🚘 {item.vehicle}

            </Text>

            <Text style={styles.cardText}>

              👤 Driver : {item.driver}

            </Text>

            <Text style={styles.cardText}>

              ⚠️ {item.violationType}

            </Text>

            <Text style={styles.cardText}>

              📍 {item.location}

            </Text>

            <Text style={styles.cardText}>

              💰 Rs. {item.fineAmount}

            </Text>

            <View

              style={[

                styles.badge,

                {

                  backgroundColor:

                    item.status === "Paid"

                      ? "#16a34a"

                      : "#f59e0b",

                },

              ]}

            >

              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                }}
              >

                {item.status}

              </Text>

            </View>

          </View>

        )}

      />

    </SafeAreaView>

  );

  }

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  header: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
    elevation: 2,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  filterBtn: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },

  activeFilter: {
    backgroundColor: "#1e3a8a",
  },

  count: {
    marginLeft: 12,
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 15,
    color: "#444",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 8,
  },

  cardText: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
  },

  badge: {
    alignSelf: "flex-end",
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

});

