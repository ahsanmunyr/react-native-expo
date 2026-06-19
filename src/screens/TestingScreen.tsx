// import { useState, useTransition } from "react";
// import { FlatList, Text, TextInput, View } from "react-native";

// const DATA = Array.from({ length: 5000 }, (_, i) => `Item ${i}`);

// export default function SearchScreen() {
//   const [query, setQuery] = useState("");
//   const [list, setList] = useState(DATA);
//   const [isPending, startTransition] = useTransition();

//   const handleChange = (text) => {
//     setQuery(text); // urgent, updates input instantly

//     startTransition(() => {
//       const filtered = DATA.filter((item) => item.includes(text));
//       setList(filtered); // non-urgent, React can delay this
//     });
//   };

//   return (
//     <View style={{ flex: 1, padding: 16 }}>
//       <TextInput
//         value={query}
//         onChangeText={handleChange}
//         placeholder="Search..."
//         style={{ borderWidth: 1, padding: 8 }}
//       />
//       {isPending && <Text>Updating list…</Text>}
//       <FlatList
//         data={list}
//         keyExtractor={(i) => i}
//         renderItem={({ item }) => <Text>{item}</Text>}
//       />
//     </View>
//   );
// }

import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";

const DATA = Array.from({ length: 1000000 }, (_, i) => `Item ${i}`);

export default function DeferredSearch() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const filtered = useMemo(
    () => DATA.filter((i) => i.includes(deferredQuery)),
    [deferredQuery],
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Type…"
        style={{ borderWidth: 1, padding: 8 }}
      />
      <Text>Live: {query}</Text>
      <Text>Deferred: {deferredQuery}</Text>
      <View style={{ opacity: isStale ? 0.5 : 1, flex: 1 }}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          renderItem={({ item }) => <Text>{item}</Text>}
        />
      </View>
    </View>
  );
}
