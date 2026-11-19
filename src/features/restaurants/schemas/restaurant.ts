import { z } from "zod";

const optionalSchema = z.string().trim().nullable().optional();

const genreSchema = z
  .string()
  .trim()
  .min(1, { error: "ジャンルを入力してください" })
  .max(20, { error: "ジャンルは20文字以内で入力してください" });

const tagSchema = z
  .string()
  .trim()
  .min(1, { error: "タグを入力してください" })
  .max(30, { error: "タグは30文字以内で入力してください" });

// 個々の時刻．例: "11:00"
const timeSchema = z.iso.time({
  precision: -1,
  message: "時間は HH:mm 形式で入力してください",
});

// 1つの営業時間帯
const businessPeriodSchema = z
  .strictObject({
    opensAt: timeSchema,
    closesAt: timeSchema,
    closesNextDay: z.boolean().default(false),
  })
  .refine(
    ({ opensAt, closesAt, closesNextDay }) =>
      closesNextDay ? closesAt <= opensAt : closesAt > opensAt,
      {
        error: "終了時刻は開始時刻より後で、1つの時間帯は24時間以内になるように指定してください",
        path: ["closesAt"],
      },
  )

// 1日分の営業情報
const businessDaySchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("open"),
    periods: z.array(businessPeriodSchema).min(1, {
      error: "営業時間帯を1つ以上指定してください",
    }),
  }),
  z.strictObject({
    status: z.literal("closed"),
  }),
  z.strictObject({
    status: z.literal("unknown"),
  }),
]);

// 1週間分の営業情報
export const businessHoursSchema = z.strictObject({
  monday: businessDaySchema,
  tuesday: businessDaySchema,
  wednesday: businessDaySchema,
  thursday: businessDaySchema,
  friday: businessDaySchema,
  saturday: businessDaySchema,
  sunday: businessDaySchema,
});

// 1週間分の営業情報の型
export type BusinessHours = z.infer<typeof businessHoursSchema>;

export const restaurantIdSchema = z.uuid();

export const createRestaurantSchema = z.strictObject({
  name: z.string().trim().min(1, { error: "店名を入力してください" }),
  address: optionalSchema,
  genre: z.array(genreSchema).optional(),
  tags: z.array(tagSchema).optional(),
  businessHours: businessHoursSchema.nullable().optional(),
  businessHoursNote: optionalSchema,
  url: z
    .string()
    .trim()
    .pipe(z.url({ protocol: /^https?$/ }))
    .nullable()
    .optional(),
  thumbnailPublicId: optionalSchema,
});

export const updateRestaurantSchema = createRestaurantSchema
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "少なくとも1つのフィールドを更新する必要があります" },
  );
