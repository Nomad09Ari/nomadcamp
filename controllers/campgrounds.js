const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

const Campground = require("../models/campground");
// const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
// const mapboxToken = process.env.MAPBOX_TOKEN;
// const geocoder = mbxGeocoding({ accessToken: mapboxToken });

const { cloudinary } = require("../cloudinary");

//正規表現メタ文字をエスケープする関数
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


module.exports.index = async (req, res) => {
  //クエリを取得
  const { q } = req.query;

  let campgrounds;

  //q が存在して空白だけじゃない場合
  if (q && q.trim !== "") {
    //メタ文字をエスケープして正規表現を作成
    const escapedQuery = escapeRegex(q.trim());

    //大文字小文字を区別せずに検索する正規表現を作成
    const regex = new RegExp(escapedQuery, "i");

    //OR検索を行うクエリを作成
    campgrounds = await Campground.find({
      $or: [{ title: regex }, { description: regex }, { location: regex }],
    });
  } else {
    //クエリが存在しないか空白だけの場合は全てのキャンプ場を取得
    campgrounds = await Campground.find({});
  }

  res.render("campgrounds/index", {
    campgrounds,
    searchQuery: q || "",
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");
  if (!campground) {
    req.flash("error", "キャンプ場は見つかりませんでした");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

module.exports.createCampground = async (req, res) => {
  // console.log("BODY:", req.body);
  // console.log("FILES:", req.files);
  // ↓↓↓ここを追加
  const geoData = await maptilerClient.geocoding.forward(
    req.body.campground.location,
    { limit: 1 }
  );

  // console.log("GEODATA:", geoData);

  const campground = new Campground(req.body.campground);

  campground.geometry = geoData.features[0].geometry;

  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.author = req.user._id;
  await campground.save();
  console.log(campground);
  req.flash("success", "新しいキャンプ場を登録しました");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "キャンプ場は見つかりませんでした");
    return res.redirect("/campgrounds");
  }

  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  console.log(req.body);
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  campground.images.push(...imgs);
  await campground.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  req.flash("success", "キャンプ場を更新しました");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  req.flash("success", "キャンプ場を削除しました");
  res.redirect("/campgrounds");
};
