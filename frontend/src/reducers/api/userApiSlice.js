import { apiSlice } from "../../store/apiSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    loginUser: builder.mutation({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: new URLSearchParams(credentials),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    }),
    registerUser: builder.mutation({
      query: (credentials) => ({
        url: "/register",
        method: "POST",
        body: credentials,
      }),
    }),
    uploadResume: builder.mutation({
      query: ({ pdf, tex }) => {
        const formData = new FormData();
        formData.append("pdf", pdf);
        formData.append("tex", tex);
        return {
          url: "/upload-resume",
          method: "POST",
          body: formData,
        };
      },
    }),
    checkATSScore: builder.mutation({
      query: ({ job_description, ai_prompt }) => {
        const formData = new FormData();
        formData.append("job_description", job_description);
        formData.append("ai_prompt", ai_prompt);
        return {
          url: "/check-ats-score",
          method: "POST",
          body: formData,
        };
      },
    }),
    optimizeResume: builder.mutation({
      query: ({ job_description }) => {
        const formData = new FormData();
        formData.append("job_description", job_description);
        return {
          url: "/optimize",
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useLoginUserMutation,
  useRegisterUserMutation,
  useUploadResumeMutation,
  useCheckATSScoreMutation,
  useOptimizeResumeMutation,
} = authApi;
