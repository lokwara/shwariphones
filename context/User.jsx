import { GET_USER } from "@/lib/request";
import { useSupabaseSession } from "@/lib/supabaseBrowser";
import React, { createContext, useContext } from "react";
import { useQuery } from "urql";

const UserContext = createContext();

function UserProvider({ children }) {
  const { session } = useSupabaseSession();

  console.log("Supabase session:", session);
  console.log("User email:", session?.user?.email);

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_USER,
    variables: {
      email: session?.user?.email,
    },
  });

  console.log("GraphQL data:", data);
  console.log("GraphQL error:", error);

  return (
    <UserContext.Provider
      value={{ refreshApp: () => reexecuteQuery(), user: data?.getUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);

export default UserProvider;
