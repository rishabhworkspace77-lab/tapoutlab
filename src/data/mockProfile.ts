import { supabase } from "./supabaseClient";

// inside App component
const [profile, setProfile] = useState<any>(null);

// fetch on mount
useEffect(() => {
  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'user-id-here') // you can use auth user later
      .single();

    if (error) console.error("Error fetching profile:", error);
    else setProfile(data);
  };

  fetchProfile();
}, []);
