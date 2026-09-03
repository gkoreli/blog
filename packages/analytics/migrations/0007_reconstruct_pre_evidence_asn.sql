-- Reconstruct network evidence for rows written before migration 0003 recorded it
-- (edge rows 2026-08-27 to 2026-09-03 01:35 UTC). Source: Cloudflare zone analytics
-- httpRequestsAdaptiveGroups (HTML, 200, GET, eyeball) grouped by hour, path,
-- country, device, client IP, pulled 2026-09-03 via GraphQL; IPs resolved to ASNs
-- through Team Cymru DNS. A row receives an ASN only when every sampled request
-- in its (hour, path, country, device) group came from one ASN; 1,429 of 1,962
-- pre-evidence rows qualified, 191 were ambiguous, 342 had no sampled group
-- (169 of those are 2026-08-26, already past the 8-day retention). Method and
-- counts: packages/blog/drafts/research/readers-vs-bots/09-fetch-metadata-prior-art.md.
-- as_org here is the Team Cymru AS name, not Cloudflare's asOrganization string.

ALTER TABLE page_observations
  ADD COLUMN asn_source TEXT CHECK (asn_source IN ('request', 'zone-sample'));

UPDATE page_observations SET asn_source = 'request' WHERE asn IS NOT NULL;

UPDATE page_observations SET asn = 396982, as_org = 'GOOGLE-CLOUD-PLATFORM - Google LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2738, 2801, 2815, 2947, 2958, 2997, 3150, 3151, 3187, 3188, 3203, 3213, 3214, 3539, 3540, 3541, 3776, 3778, 3791, 3792, 3793, 3794, 3795, 3796, 3797, 3798, 3799, 3800, 3801, 3802, 3803, 3804, 3805, 3806, 3807, 3808, 3809, 3810, 3811, 3812, 3813, 3814, 3815, 3816, 3817, 3818, 3819, 3820, 3821, 3822, 3823, 3824, 3825, 3826, 3827, 3828, 3829, 3830, 3831, 3832, 3833, 3834, 3835, 3836, 3837, 3838, 3839, 3840, 3841, 3842, 3843, 3844, 3845, 3846, 3847, 3848, 3849, 3850, 3851, 3852, 3853, 3854, 3855, 3856, 3857, 3858, 3859, 3860, 3861, 3862, 3863, 3864, 3865, 3866, 3867, 3868, 3869, 3870, 3871, 3872, 3873, 3874, 3875, 3876, 3877, 3878, 3879, 3880, 3881, 3882, 3883, 3884, 3885, 3886, 3887, 3888, 3889, 3890, 3891, 3892, 3893, 3894, 3895, 3896, 3897, 3898, 3899, 3900, 3901, 3902, 3903, 3904, 3905, 3906, 3907, 3908, 3909, 3910, 3911, 3912, 3913, 3914, 3931, 3932, 3933, 3934, 3937, 3938, 3939, 3940, 3941, 3942, 3943, 3944, 3945, 3946, 3947, 3948, 3949, 3950, 3951, 3952, 3953, 3954, 3955, 3956, 3957, 3958, 3959, 3960, 3961, 3962, 3963, 3964, 3965, 3966, 3968, 3969, 3970, 3972, 3973, 3974, 3975, 3976, 3977, 3978, 3979, 3980, 3981, 3982, 3983, 3984, 3985, 3986, 3987, 3988, 3989, 3990, 3991, 3992, 3995, 3996, 3997, 3998, 3999, 4000, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4011, 4012, 4013, 4014, 4015, 4016, 4017, 4018, 4019, 4020, 4021, 4022, 4023, 4024, 4026, 4027, 4028, 4029, 4030, 4032, 4034, 4035, 4036, 4037, 4038, 4039, 4040, 4041, 4042, 4043, 4044, 4045, 4046, 4047, 4048, 4049, 4050, 4051, 4052, 4053, 4054, 4055, 4056, 4070, 4071, 4072, 4073, 4074, 4075, 4076, 4077, 4078, 4079, 4080, 4081, 4082, 4083, 4084, 4085, 4086, 4087, 4088, 4089, 4090, 4091, 4092, 4093, 4094, 4095, 4096, 4097, 4098, 4099, 4100, 4101, 4102, 4103, 4104, 4105, 4106, 4107, 4108, 4109, 4110, 4111, 4112, 4113, 4114, 4115, 4116, 4117, 4118, 4119, 4120, 4121, 4122, 4123, 4124, 4125, 4126, 4127, 4128, 4129, 4130, 4131, 4208, 4209, 4210, 4211, 4212, 4213, 4214, 4215, 4216, 4217, 4218, 4221, 4222, 4223, 4224, 4225, 4226, 4227, 4228, 4229, 4230, 4231, 4232, 4233, 4234, 4235, 4236, 4237, 4242, 4259, 4314, 4315, 4316, 4317, 4318, 4319, 4320, 4321, 4322, 4323, 4324, 4325, 4326, 4327, 4328, 4329, 4330, 4331, 4332, 4333, 4334, 4335, 4336, 4337, 4338, 4339, 4340, 4341, 4342, 4343, 4344, 4378, 4414);
UPDATE page_observations SET asn = 16276, as_org = 'OVH - OVH SAS, FR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2740, 2751, 2755, 2760, 2777, 2779, 2796, 2825, 2850, 2854, 2855, 2859, 2899, 2901, 2905, 2914, 2926, 2940, 2956, 2957, 2975, 2984, 2985, 3001, 3137, 3139, 3157, 3160, 3175, 3202, 3204, 3302, 3304, 3305, 3306, 3307, 3308, 3309, 3310, 3311, 3312, 3313, 3314, 3315, 3316, 3317, 3318, 3320, 3321, 3322, 3323, 3324, 3325, 3326, 3327, 3328, 3329, 3331, 3332, 3334, 3335, 3336, 3337, 3371, 3385, 3386, 3387, 3388, 3389, 3390, 3391, 3392, 3393, 3394, 3395, 3396, 3397, 3398, 3399, 3400, 3401, 3402, 3403, 3404, 3405, 3406, 3407, 3408, 3409, 3410, 3411, 3412, 3413, 3414, 3415, 3416, 3417, 3418, 3419, 3420, 3421, 3422, 3433, 3434, 3435, 3436, 3437, 3438, 3439, 3440, 3441, 3442, 3443, 3444, 3445, 3446, 3447, 3448, 3449, 3450, 3451, 3452, 3453, 3454, 3455, 3456, 3457, 3458, 3459, 3460, 3461, 3462, 3463, 3464, 3465, 3466, 3467, 3468, 3469, 3470, 3551, 3556, 3557, 3558, 3563, 3564, 3565, 3568, 3569, 3579, 3583, 3591, 3600, 3727, 3740, 3774, 3781, 3783, 3790, 4166, 4287, 4289, 4290, 4385, 4407, 4433, 4435, 4440, 4446, 4482, 4483, 4484);
UPDATE page_observations SET asn = 132203, as_org = 'TENCENT-NET-AP-CN - Tencent Building, Kejizhongyi Avenue, CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2735, 2756, 2757, 2758, 2759, 2800, 2846, 2881, 2910, 2911, 2912, 2913, 2916, 2918, 2919, 2922, 2924, 2925, 2927, 2928, 2929, 2931, 2932, 2944, 2952, 2960, 2979, 3004, 3006, 3012, 3013, 3015, 3016, 3017, 3019, 3020, 3027, 3030, 3031, 3032, 3109, 3158, 3170, 3179, 3205, 3232, 3368, 3554, 3572, 3594, 3603, 3604, 3605, 3609, 3649, 3650, 3651, 3652, 3654, 3693, 3703, 3731, 3746, 3759, 3775, 3920, 3922, 3923, 3925, 3926, 4060, 4063, 4064, 4065, 4067, 4069, 4145, 4146, 4149, 4150, 4154, 4169, 4196, 4253, 4274, 4277, 4280, 4281, 4282, 4298, 4360, 4362, 4380, 4409, 4456, 4457, 4460, 4469, 4472, 4475, 4478, 4479, 4480, 4481, 4486, 4488, 4491, 4493, 4494, 4495, 4501, 4502, 4503, 4506, 4508, 4512, 4522);
UPDATE page_observations SET asn = 14618, as_org = 'AMAZON-AES - Amazon.com, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2737, 2798, 2892, 2941, 2954, 2974, 3003, 3112, 3113, 3114, 3115, 3116, 3117, 3118, 3119, 3120, 3121, 3122, 3123, 3124, 3125, 3126, 3127, 3128, 3129, 3130, 3131, 3132, 3133, 3134, 3135, 3136, 3702, 3742, 3747, 3755, 3756, 3779, 3917, 3924, 4143, 4148, 4159, 4165, 4168, 4173, 4178, 4180, 4181, 4182, 4183, 4184, 4185, 4186, 4187, 4189, 4190, 4191, 4192, 4193, 4200, 4255, 4257, 4266, 4283, 4292, 4363, 4364, 4365, 4366, 4367, 4368, 4375);
UPDATE page_observations SET asn = 211590, as_org = 'BUCKLOG - Bucklog SARL, FR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3040, 3041, 3043, 3044, 3045, 3046, 3047, 3048, 3049, 3050, 3051, 3052, 3053, 3056, 3057, 3058, 3059, 3060, 3061, 3062, 3063, 3068, 3085, 3090, 3100, 3101, 3102, 3103, 3104, 3105, 3472, 3473, 3474, 3475, 3476, 3477, 3478, 3479, 3481, 3482, 3483, 3484, 3485, 3486, 3487, 3488, 3490, 3527, 3528, 3531, 3532, 3533, 3612, 3622, 3629, 3636, 3637, 3641, 3658, 3660, 3663, 3664, 3669, 3671, 3672, 3675, 3678, 3690);
UPDATE page_observations SET asn = 8075, as_org = 'MICROSOFT-CORP-MSN-AS-BLOCK - Microsoft Corporation, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2747, 2799, 2804, 2805, 2806, 2807, 2808, 2809, 2810, 2813, 2816, 2818, 2819, 2822, 2844, 2943, 2961, 2966, 2967, 2969, 2970, 2986, 2987, 2988, 2989, 2991, 2992, 2994, 2996, 3039, 3107, 3165, 3166, 3173, 3189, 3212, 3349, 3566, 3597, 3769, 3789, 4066, 4151, 4152, 4205, 4254, 4256, 4269, 4275, 4387, 4496, 4497);
UPDATE page_observations SET asn = 16509, as_org = 'AMAZON-02 - Amazon.com, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2862, 2886, 2903, 2908, 2945, 2965, 2981, 3171, 3172, 3182, 3186, 3595, 3596, 3653, 3732, 3736, 3748, 3751, 3752, 3771, 4160, 4195, 4267, 4288, 4299, 4377, 4388, 4392, 4393, 4394, 4395, 4396, 4397, 4398, 4399, 4406, 4416, 4464, 4467, 4471, 4485, 4487, 4492, 4499, 4504, 4514, 4516, 4520);
UPDATE page_observations SET asn = 18779, as_org = 'EGIHOSTING - EGIHosting, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3140, 3253, 3254, 3255, 3256, 3257, 3258, 3259, 3260, 3261, 3263, 3264, 3265, 3266, 3267, 3268, 3269, 3270, 3271, 3272, 3273, 3274, 3275, 3277, 3278, 3279, 3280, 3281, 3282, 3284, 3285, 3286, 3287, 3534, 3535, 3536, 4505);
UPDATE page_observations SET asn = 62887, as_org = 'WHITESKY-COMMUNICATIONS - WhiteSky Communications, LLC., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2753, 2761, 2762, 2763, 2781, 2789, 2790, 2791, 2792, 2794, 2882, 2883, 3230, 3559, 3694, 3695, 4417, 4418, 4419, 4420, 4421, 4422, 4423, 4424, 4500);
UPDATE page_observations SET asn = 32934, as_org = 'FACEBOOK - Facebook, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2870, 2871, 2872, 2873, 2874, 2879, 2880, 2933, 2934, 2935, 2936, 2937, 2938, 2939, 3174, 3180, 3588, 4132, 4206, 4245, 4250, 4252, 4285, 4312, 4391);
UPDATE page_observations SET asn = 14061, as_org = 'DIGITALOCEAN-ASN - DigitalOcean, LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2831, 2845, 2909, 3014, 3033, 3110, 3233, 3246, 3570, 3718, 3919, 3994, 4140, 4354, 4372, 4376, 4410, 4412, 4452, 4458, 4521, 4523);
UPDATE page_observations SET asn = 15169, as_org = 'GOOGLE - Google LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2783, 2787, 2837, 2838, 2885, 2968, 2972, 3036, 3169, 3234, 3542, 3560, 3699, 3700, 3770, 4309, 4310, 4311, 4442, 4444);
UPDATE page_observations SET asn = 209366, as_org = 'SEMRUSH-AS - SEMrush CY LTD, CY', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2752, 2953, 2963, 3111, 3152, 3156, 3168, 3576, 3581, 3724, 4167, 4260, 4286, 4300, 4313, 4346, 4349, 4383);
UPDATE page_observations SET asn = 45090, as_org = 'TENCENT-NET-AP - Shenzhen Tencent Computer Systems Company Limited, CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2749, 2860, 2930, 2962, 3034, 3167, 3211, 3550, 3602, 3737, 3777, 4155, 4203, 4273, 4373, 4463);
UPDATE page_observations SET asn = 400940, as_org = 'RAILWAY - Railway, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2836, 2906, 2915, 3235, 3364, 3365, 3367, 3369, 3544, 3549, 3553, 3555, 3567, 3578, 3582, 3590);
UPDATE page_observations SET asn = 45102, as_org = 'ALIBABA-CN-NET - Alibaba (US) Technology Co., Ltd., CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2857, 2973, 3009, 3178, 3580, 3773, 3993, 4156, 4243, 4361, 4386, 4451, 4461);
UPDATE page_observations SET asn = 13414, as_org = 'TWITTER - Twitter Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3002, 3181, 3191, 3227, 3228, 4170, 4198, 4199, 4437, 4438, 4439, 4476, 4513);
UPDATE page_observations SET asn = 212238, as_org = 'CDNEXT - Datacamp Limited, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2802, 2843, 2853, 3729, 3749, 3787, 3788, 4135, 4248, 4251, 4351, 4352);
UPDATE page_observations SET asn = 13335, as_org = 'CLOUDFLARENET - Cloudflare, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2864, 3293, 3538, 3764, 3766, 3767, 3768);
UPDATE page_observations SET asn = 201814, as_org = 'Mevspace - MEVSPACE sp. z o.o., PL', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3297, 3298, 3529, 3530, 3717, 4509, 4510);
UPDATE page_observations SET asn = 4837, as_org = 'CHINA169-Backbone - CHINA UNICOM China169 Backbone, CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2742, 2744, 2849, 2852, 2949, 3743);
UPDATE page_observations SET asn = 24940, as_org = 'HETZNER-AS - Hetzner Online GmbH, DE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2775, 3382, 3730, 4258, 4436, 4466);
UPDATE page_observations SET asn = 4811, as_org = 'CHINANET-SHANGHAI-MAN - China Telecom (Group), CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2841, 2842, 3598, 3599, 3697, 3698);
UPDATE page_observations SET asn = 31898, as_org = 'ORACLE-BMC-31898 - Oracle Corporation, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3340, 3383, 3425, 3738, 3739, 4507);
UPDATE page_observations SET asn = 51747, as_org = 'INTERNETBOLAGET - Internet Vikings International AB, SE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2736, 2907, 3238, 3750, 4477);
UPDATE page_observations SET asn = 4134, as_org = 'CHINANET-BACKBONE - No.31,Jin-rong Street, CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2741, 2743, 2848, 2851, 2856);
UPDATE page_observations SET asn = 18450, as_org = 'WEBNX - WebNX, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2875, 2900, 4262, 4263, 4371);
UPDATE page_observations SET asn = 714, as_org = 'APPLE-ENGINEERING - Apple Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2942, 3537, 3696, 3754, 3772);
UPDATE page_observations SET asn = 203020, as_org = 'HostRoyale - HostRoyale Technologies Pvt Ltd, IN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3162, 3348, 3352, 4058);
UPDATE page_observations SET asn = 8560, as_org = 'IONOS-AS - IONOS SE, DE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3354, 3355, 3356, 3357);
UPDATE page_observations SET asn = 60068, as_org = 'CDN77 - Datacamp Limited, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4061, 4062, 4358, 4359);
UPDATE page_observations SET asn = 210558, as_org = 'services-1337-gmbh - 1337 Services GmbH, DE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4175, 4176, 4294, 4295);
UPDATE page_observations SET asn = 211298, as_org = 'DRIFTNET - Driftnet Ltd, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2750, 2766, 2768);
UPDATE page_observations SET asn = 55960, as_org = 'BJ-GUANGHUAN-AP - Beijing Guanghuan Xinwang Digital, CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2764, 2765, 2767);
UPDATE page_observations SET asn = 3257, as_org = 'GTT-BACKBONE - GTT Communications Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2803, 2833, 3780);
UPDATE page_observations SET asn = 60868, as_org = 'BRANDWATCH-AS - Runtime Collective Limited, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2826, 2827, 2887);
UPDATE page_observations SET asn = 7224, as_org = 'AMAZON-AS - Amazon.com, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2891, 2894, 2896);
UPDATE page_observations SET asn = 207825, as_org = 'DATARYMDEN-AS - Datarymden Internet AB, SE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2920, 2921, 4511);
UPDATE page_observations SET asn = 210743, as_org = 'BABBAR-AS - Babbar SAS, FR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3005, 3007, 3008);
UPDATE page_observations SET asn = 9009, as_org = 'M247 - M247 Europe SRL, RO', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3035, 3201, 3206);
UPDATE page_observations SET asn = 219502, as_org = 'STORMCLOUD-AS - Storm Industries LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3038, 4293, 4301);
UPDATE page_observations SET asn = 48090, as_org = 'DMZHOST - TECHOFF SRV LIMITED, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3106, 3786, 4161);
UPDATE page_observations SET asn = 9121, as_org = 'TTNet - Turk Telekomunikasyon Anonim Sirketi, TR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3225, 3561, 4498);
UPDATE page_observations SET asn = 205759, as_org = 'GHOSTYNETWORKS - Ghosty Networks LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3350, 3351, 4415);
UPDATE page_observations SET asn = 30058, as_org = 'FDCSERVERS - FDCservers.net, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3545, 3918, 4141);
UPDATE page_observations SET asn = 59711, as_org = 'HZ-EU-AS - HZ Hosting Ltd, BG', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4524, 4526, 4527);
UPDATE page_observations SET asn = 212286, as_org = 'LONCONNECT - LonConnect Ltd, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2834, 4241);
UPDATE page_observations SET asn = 7029, as_org = 'WINDSTREAM - Windstream Communications LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2839, 3547);
UPDATE page_observations SET asn = 22773, as_org = 'ASN-CXA-ALL-CCI-22773-RDC - Cox Communications Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2840, 2948);
UPDATE page_observations SET asn = 27901, as_org = 'AS27901 - Pacifico Cable SPA., CL', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2902, 3606);
UPDATE page_observations SET asn = 18403, as_org = 'FPT-VN - FPT Telecom Company, VN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2955, 2964);
UPDATE page_observations SET asn = 45899, as_org = 'VNPT-AS-VN - VNPT Corp, VN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2959, 4270);
UPDATE page_observations SET asn = 62874, as_org = 'WEB2OBJECTS - Web2Objects LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2982, 4202);
UPDATE page_observations SET asn = 12430, as_org = 'VODAFONE_ES - VODAFONE ESPANA S.A.U., ES', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2983, 4468);
UPDATE page_observations SET asn = 210906, as_org = 'BITE-US - UAB _Bite Lietuva_, LT', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2998, 2999);
UPDATE page_observations SET asn = 17072, as_org = 'AS17072 - TOTAL PLAY TELECOMUNICACIONES, S.A.P.I. DE C.V., MX', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3021, 3176);
UPDATE page_observations SET asn = 10620, as_org = 'AS10620 - Telmex Colombia S.A., CO', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3024, 4133);
UPDATE page_observations SET asn = 55286, as_org = 'SERVER-MANIA - B2 Net Solutions Inc., CA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3142, 3149);
UPDATE page_observations SET asn = 9299, as_org = 'IPG-AS-AP - Philippine Long Distance Telephone Company, PH', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3161, 3358);
UPDATE page_observations SET asn = 56045, as_org = 'CMNET-Jiangxi-AP - China Mobile communications corporation, CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3177, 3586);
UPDATE page_observations SET asn = 18881, as_org = 'AS18881 - TELEFONICA BRASIL S.A, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3223, 3426);
UPDATE page_observations SET asn = 20011, as_org = 'Dimension Data - Dimension Data, ZA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3239, 3921);
UPDATE page_observations SET asn = 154177, as_org = 'LIGHT4-AS-AP - LIGHT NODE LIMITED, HK', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3370, 3546);
UPDATE page_observations SET asn = 51167, as_org = 'CONTABO - Contabo GmbH, DE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3543, 4515);
UPDATE page_observations SET asn = 5384, as_org = 'EMIRATES-INTERNET - EMIRATES TELECOMMUNICATIONS GROUP COMPANY (ETISALAT GROUP) PJSC, AE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3573, 4489);
UPDATE page_observations SET asn = 137266, as_org = 'CHINATELECOM-HUBEI-WUHAN-5G-NETWORK - CHINATELECOM Hubei province Wuhan 5G network, CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3574, 3575);
UPDATE page_observations SET asn = 62610, as_org = 'ZEN-DPS - Zenlayer Inc, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3601, 4158);
UPDATE page_observations SET asn = 11798, as_org = 'ACEDATACENTERS-AS-1 - Ace Data Centers, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3701, 4247);
UPDATE page_observations SET asn = 8346, as_org = 'SONATEL - IDDQD-AS, SN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3707, 3708);
UPDATE page_observations SET asn = 141995, as_org = 'CAPL-AS-AP - Contabo Asia Private Limited, SG', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3721, 3722);
UPDATE page_observations SET asn = 213790, as_org = 'LimitedNetwork-AS - Limited Network LTD, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3725, 3741);
UPDATE page_observations SET asn = 12876, as_org = 'AS12876 - Scaleway SAS, FR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3734, 3735);
UPDATE page_observations SET asn = 9808, as_org = 'CHINAMOBILE-CN - China Mobile Communications Group Co., Ltd., CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3760, 4244);
UPDATE page_observations SET asn = 43180, as_org = 'TRUNKNETWORKS-AS - Trunk Networks LTD, SC', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3785, 4384);
UPDATE page_observations SET asn = 6739, as_org = 'ONO-AS - VODAFONE ONO, S.A., ES', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3928, 3929);
UPDATE page_observations SET asn = 396356, as_org = 'LATITUDE-SH - Latitude.sh, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4147, 4204);
UPDATE page_observations SET asn = 14956, as_org = 'ROUTERHOSTING - RouterHosting LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4278, 4279);
UPDATE page_observations SET asn = 57269, as_org = 'DIGI-ES - DIGI SPAIN TELECOM S.A, ES', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4348, 4350);
UPDATE page_observations SET asn = 3786, as_org = 'LGDACOM-KR - LG DACOM Corporation, KR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2739);
UPDATE page_observations SET asn = 2516, as_org = 'KDDI - KDDI CORPORATION, JP', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2748);
UPDATE page_observations SET asn = 57433, as_org = 'INTERCOLO-AS - intercolo GmbH, DE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2797);
UPDATE page_observations SET asn = 27773, as_org = 'AS27773 - MILLICOM CABLE EL SALVADOR S.A. DE C.V., SV', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2828);
UPDATE page_observations SET asn = 45669, as_org = 'Mobilink-AS-PK - PMCL /LDI IP TRANSIT, PK', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2829);
UPDATE page_observations SET asn = 13357, as_org = 'AS13357 - Ampernet Telecomunicacoes Ltda, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2830);
UPDATE page_observations SET asn = 24086, as_org = 'VIETTEL-AS-VN - Viettel Corporation, VN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2832);
UPDATE page_observations SET asn = 271550, as_org = 'AS271550 - FIBRANET TELECOM EIRELI, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2847);
UPDATE page_observations SET asn = 64300, as_org = 'JSN-AS-ID - PT JARINGANKU SARANA NUSANTARA, ID', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2858);
UPDATE page_observations SET asn = 5466, as_org = 'EIRCOM - Eircom Limited, IE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2861);
UPDATE page_observations SET asn = 29695, as_org = 'Altibox_AS - Lyse Tele AS, NO', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2863);
UPDATE page_observations SET asn = 19318, as_org = 'IS-AS-1 - Interserver, Inc, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2884);
UPDATE page_observations SET asn = 267685, as_org = 'AS267685 - SIRIO TELECOMUNICACIONES S.R.L, BO', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2898);
UPDATE page_observations SET asn = 45609, as_org = 'BHARTI-MOBILITY-AS-AP - Bharti Airtel Ltd. AS for GPRS Service, IN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2904);
UPDATE page_observations SET asn = 19114, as_org = 'AS19114 - Otecel S.A., EC', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2923);
UPDATE page_observations SET asn = 24921, as_org = 'LMT-3G - Latvijas Mobilais Telefons SIA, LV', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2946);
UPDATE page_observations SET asn = 21299, as_org = 'KAR-TEL-AS - Kar-Tel LLC, KZ', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2950);
UPDATE page_observations SET asn = 5650, as_org = 'FRONTIER-FRTR - Frontier Communications of America, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2971);
UPDATE page_observations SET asn = 39232, as_org = 'UNINET - Uninet LLC, AZ', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2976);
UPDATE page_observations SET asn = 59668, as_org = 'ATURON - Turon Media XK, UZ', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2977);
UPDATE page_observations SET asn = 51375, as_org = 'VIVABH - STC BAHRAIN B.S.C CLOSED, BH', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2978);
UPDATE page_observations SET asn = 28210, as_org = 'AS28210 - GIGA MAIS FIBRA TELECOMUNICACOES S.A., BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2980);
UPDATE page_observations SET asn = 328917, as_org = 'Sonic Computers & Wi-Fi cc - Sonic Computers & Wi-Fi cc, ZA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (2990);
UPDATE page_observations SET asn = 36352, as_org = 'AS-COLOCROSSING - HostPapa, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3000);
UPDATE page_observations SET asn = 271855, as_org = 'AS271855 - MANGO NETWORK, C. A. MANGONET, C. A,, VE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3018);
UPDATE page_observations SET asn = 64139, as_org = 'AS64139 - GRUPO METROWAN TELECOM SPA, CL', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3022);
UPDATE page_observations SET asn = 263250, as_org = 'AS263250 - Barbosa & Costa Ltda, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3023);
UPDATE page_observations SET asn = 273182, as_org = 'AS273182 - Cablexpress TV C.A., VE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3025);
UPDATE page_observations SET asn = 34458, as_org = 'SMARTNETSLB - Smart Networks S.a.r.l, LB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3026);
UPDATE page_observations SET asn = 25019, as_org = 'SAUDINETSTC-AS - Saudi Telecom Company JSC, SA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3028);
UPDATE page_observations SET asn = 8151, as_org = 'AS8151 - UNINET, MX', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3029);
UPDATE page_observations SET asn = 7015, as_org = 'COMCAST-7015 - Comcast Cable Communications, LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3037);
UPDATE page_observations SET asn = 54004, as_org = 'LIGHTPATH - Cablevision Lightpath LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3108);
UPDATE page_observations SET asn = 139008, as_org = 'NEEFIT-AS-AP - NEEF IT LIMITED, BD', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3138);
UPDATE page_observations SET asn = 33771, as_org = 'Safaricom Limited - Safaricom Limited, KE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3141);
UPDATE page_observations SET asn = 33659, as_org = 'CMCS - Comcast Cable Communications, LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3143);
UPDATE page_observations SET asn = 28580, as_org = 'AS28580 - Cilnet Comunicacao e Informatica S.A., BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3153);
UPDATE page_observations SET asn = 7303, as_org = 'AS7303 - Telecom Argentina S.A., AR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3154);
UPDATE page_observations SET asn = 274155, as_org = 'AS274155 - DIGITAL DOT GROUP SAS, CO', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3155);
UPDATE page_observations SET asn = 150750, as_org = 'ICIL-AS-AP - IN CABLE INTERNET (PRIVATE) LIMITED, PK', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3183);
UPDATE page_observations SET asn = 8193, as_org = 'BRM-AS - _Uzbektelekom_ Joint Stock Company, UZ', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3184);
UPDATE page_observations SET asn = 24560, as_org = 'AIRTELBROADBAND-AS-AP - Bharti Airtel Ltd., Telemedia Services, IN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3185);
UPDATE page_observations SET asn = 9541, as_org = 'CYBERNET-AP - Cyber Internet Services (Pvt) Ltd., PK', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3190);
UPDATE page_observations SET asn = 23352, as_org = 'SERVERCENTRAL - DEFT.COM, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3207);
UPDATE page_observations SET asn = 269046, as_org = 'AS269046 - First Telecom LTDA, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3210);
UPDATE page_observations SET asn = 47586, as_org = 'Business-Svyaz - Dmitriy V. Kozmenko, RU', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3215);
UPDATE page_observations SET asn = 28146, as_org = 'AS28146 - MHNET TELECOM, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3216);
UPDATE page_observations SET asn = 61466, as_org = 'AS61466 - TV Cable Loncomilla S.A., CL', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3217);
UPDATE page_observations SET asn = 11562, as_org = 'AS11562 - Net Uno, C.A., VE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3218);
UPDATE page_observations SET asn = 39010, as_org = 'TERRANET-AS - TerraNet sal, LB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3219);
UPDATE page_observations SET asn = 7738, as_org = 'AS7738 - V tal, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3220);
UPDATE page_observations SET asn = 266250, as_org = 'AS266250 - ESSO FIBRA, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3221);
UPDATE page_observations SET asn = 44546, as_org = 'ALFATELECOM-AS - ALFA TELECOM s.r.o., CZ', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3222);
UPDATE page_observations SET asn = 37049, as_org = 'SADV (Pty) Ltd - SADV (Pty) Ltd, ZA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3224);
UPDATE page_observations SET asn = 207043, as_org = 'DEDIK-IO - DEDIK SERVICES LIMITED, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3226);
UPDATE page_observations SET asn = 49183, as_org = 'BEREZHANY-AS - _Galichina Telekommunication_ LTD, UA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3345);
UPDATE page_observations SET asn = 5378, as_org = 'unspecified - Vodafone Limited, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3347);
UPDATE page_observations SET asn = 399629, as_org = 'BLNWX - BL Networks, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3353);
UPDATE page_observations SET asn = 206804, as_org = 'EstNOC-GLOBAL - EstNOC OU, EE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3377);
UPDATE page_observations SET asn = 197769, as_org = 'VPSDEDICATED-AS - VPS Dedicated LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3424);
UPDATE page_observations SET asn = 197540, as_org = 'netcup-AS - netcup GmbH, DE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3548);
UPDATE page_observations SET asn = 398722, as_org = 'CENSYS-ARIN-03 - Censys, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3552);
UPDATE page_observations SET asn = 142430, as_org = 'DIGIVPS-AS-AP - DIGI VPS, IN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3562);
UPDATE page_observations SET asn = 203610, as_org = 'DHOLD - Internet Vikings International AB, SE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3571);
UPDATE page_observations SET asn = 200019, as_org = 'AlexHost - ALEXHOST SRL, MD', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3577);
UPDATE page_observations SET asn = 5089, as_org = 'NTL - Virgin Media Limited, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3584);
UPDATE page_observations SET asn = 3243, as_org = 'MEO-RESIDENCIAL - MEO - SERVICOS DE COMUNICACOES E MULTIMEDIA S.A., PT', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3585);
UPDATE page_observations SET asn = 21003, as_org = 'General Post and Telecommunication Company (GPTC) - General Post and Telecommunication Company (GPTC), LY', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3704);
UPDATE page_observations SET asn = 40786, as_org = 'DIGI-GRP-JAM - Digicel Jamaica, JM', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3705);
UPDATE page_observations SET asn = 37105, as_org = 'RAIN GROUP HOLDINGS (PTY) LTD - RAIN GROUP HOLDINGS (PTY) LTD, ZA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3706);
UPDATE page_observations SET asn = 205290, as_org = 'NAOBOROT-AS - NAOBOROT LLP, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3709);
UPDATE page_observations SET asn = 30689, as_org = 'FLOW-NET - FLOW, JM', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3710);
UPDATE page_observations SET asn = 8167, as_org = 'AS8167 - V tal, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3711);
UPDATE page_observations SET asn = 14593, as_org = 'SPACEX-STARLINK - Space Exploration Technologies Corporation, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3720);
UPDATE page_observations SET asn = 329255, as_org = 'Telcoptics Solutions Ltd - Telcoptics Solutions Ltd, KE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3726);
UPDATE page_observations SET asn = 19165, as_org = 'WEBPASS - Webpass Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3728);
UPDATE page_observations SET asn = 7552, as_org = 'VIETEL-AS-AP - Viettel Group, VN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3733);
UPDATE page_observations SET asn = 209605, as_org = 'hostbaltic - UAB Host Baltic, LT', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3753);
UPDATE page_observations SET asn = 150493, as_org = 'IDNIC-PGSS-AS-ID - PT Gunung Sedayu Sentosa, ID', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3757);
UPDATE page_observations SET asn = 42708, as_org = 'GLESYS - Glesys AB, SE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3758);
UPDATE page_observations SET asn = 47890, as_org = 'UNMANAGED-DEDICATED-SERVERS - UNMANAGED LTD, GB', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3761);
UPDATE page_observations SET asn = 23724, as_org = 'CHINANET-IDC-BJ-AP - IDC, China Telecommunications Corporation, CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3782);
UPDATE page_observations SET asn = 269567, as_org = 'AS269567 - OP DOS SANTOS & CIA LTDA, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3784);
UPDATE page_observations SET asn = 36183, as_org = 'AKAMAI-AS - Akamai Technologies, Inc., US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3915);
UPDATE page_observations SET asn = 137453, as_org = 'ORANGE2-AS-AP - Orange Communication, BD', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (3916);
UPDATE page_observations SET asn = 12252, as_org = 'AS12252 - America Movil Peru S.A.C., PE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4057);
UPDATE page_observations SET asn = 6568, as_org = 'AS6568 - EMPRESA NACIONAL DE TELECOMUNICACIONES SOCIEDAD ANONIMA, BO', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4068);
UPDATE page_observations SET asn = 262769, as_org = 'AS262769 - AVANZA TELECOM LTDA, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4139);
UPDATE page_observations SET asn = 50635, as_org = 'SkynetTelecomLLC - Skynet Telecom LLC, AM', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4142);
UPDATE page_observations SET asn = 202422, as_org = 'GHOST - G-Core Labs S.A., LU', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4153);
UPDATE page_observations SET asn = 16628, as_org = 'DEDICATED-FIBER-COMMUNICATIONS - DedFiberCo, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4157);
UPDATE page_observations SET asn = 7713, as_org = 'telkomnet-as-ap - PT Telekomunikasi Indonesia, ID', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4172);
UPDATE page_observations SET asn = 37550, as_org = 'Airtel Congo S.A - Airtel Congo S.A, CG', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4174);
UPDATE page_observations SET asn = 23033, as_org = 'WOW - Wowrack.com, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4197);
UPDATE page_observations SET asn = 8308, as_org = 'NASK-COMMERCIAL - NAUKOWA I AKADEMICKA SIEC KOMPUTEROWA - PANSTWOWY INSTYTUT BADAWCZY, PL', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4201);
UPDATE page_observations SET asn = 6799, as_org = 'OTENET-GR - Ote SA (Hellenic Telecommunications Organisation), GR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4246);
UPDATE page_observations SET asn = 31143, as_org = 'CosmosTV-AS - COSMOS TV JLLC, BY', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4249);
UPDATE page_observations SET asn = 209240, as_org = 'isanet - ISA.NET Sh.p.k., AL', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4261);
UPDATE page_observations SET asn = 36903, as_org = 'Office National des Postes et Telecommunications ONPT (Maroc Telecom) / IAM - Office National des Postes et Telecommunications ONPT (Maroc Telecom) / IAM, MA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4264);
UPDATE page_observations SET asn = 6079, as_org = 'RCN-AS - RCN, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4265);
UPDATE page_observations SET asn = 19429, as_org = 'AS19429 - ETB - Colombia, CO', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4268);
UPDATE page_observations SET asn = 59588, as_org = 'ZAINAS-IQ - Al Atheer Telecommunication-Iraq Co. Ltd. Incorporated in Cayman Islands, IQ', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4271);
UPDATE page_observations SET asn = 263073, as_org = 'AS263073 - DTEL TELECOM, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4272);
UPDATE page_observations SET asn = 135905, as_org = 'VNPT-AS-VN - VIETNAM POSTS AND TELECOMMUNICATIONS GROUP, VN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4276);
UPDATE page_observations SET asn = 43766, as_org = 'MTC-KSA-AS - Mobile Telecommunication Company Saudi Arabia Joint-Stock company, SA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4284);
UPDATE page_observations SET asn = 269832, as_org = 'AS269832 - MDS TELECOM C.A., VE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4291);
UPDATE page_observations SET asn = 56044, as_org = 'CMNET-AS-Liaoning - China Mobile communications corporation, CN', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4304);
UPDATE page_observations SET asn = 7018, as_org = 'ATT-INTERNET4 - AT&T Enterprises, LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4357);
UPDATE page_observations SET asn = 7922, as_org = 'COMCAST-7922 - Comcast Cable Communications, LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4374);
UPDATE page_observations SET asn = 51645, as_org = 'IRKUTSK-AS - JSC _ER-Telecom Holding_, RU', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4379);
UPDATE page_observations SET asn = 20473, as_org = 'AS-VULTR - The Constant Company, LLC, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4389);
UPDATE page_observations SET asn = 37061, as_org = 'Safaricom Limited - Safaricom Limited, KE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4390);
UPDATE page_observations SET asn = 36947, as_org = 'Telecom Algeria - Telecom Algeria, DZ', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4403);
UPDATE page_observations SET asn = 20001, as_org = 'TWC-20001-PACWEST - Charter Communications Inc, US', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4404);
UPDATE page_observations SET asn = 3320, as_org = 'DTAG - Deutsche Telekom AG, DE', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4454);
UPDATE page_observations SET asn = 267373, as_org = 'AS267373 - AGIL TECOMUNICACOES LTDA, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4462);
UPDATE page_observations SET asn = 268214, as_org = 'AS268214 - schossler e silva ltda - me, BR', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4473);
UPDATE page_observations SET asn = 43037, as_org = 'SEZNAM-CZ - SEZNAM-CZ, CZ', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4474);
UPDATE page_observations SET asn = 59847, as_org = 'WIRAC - WIRAC.NET d.o.o., BA', asn_source = 'zone-sample'
  WHERE asn IS NULL AND id IN (4490);

-- Rows whose reconstructed network is a hosting provider are cloud browsers or
-- hosted bots regardless of request shape (same rule as readerkind.ts).
UPDATE page_observations
SET reader_kind = 'cloud-browser', reader_reason = 'hosting-asn:' || asn
WHERE asn_source = 'zone-sample' AND traffic_class = 'browser'
  AND asn IN (16509, 14618, 396982, 8075, 14061, 24940, 16276, 20473, 63949, 31898, 45102, 45090, 132203, 51167, 40021, 141995, 12876, 16265, 60781, 8560, 30058, 211590, 18779);
