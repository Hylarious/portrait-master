const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

function escape(html) {
  return html.replace(/&/g, "")
             .replace(/</g, "")
             .replace(/>/g, "")
             .replace(/"/g, "")
             .replace(/'/g, "");
}

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;
    const fileName = file.path.split('/').slice(-1)[0];
    const fileExt = fileName.split('.').slice(-1)[0];
    const emailPattern = new RegExp(/(^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$)/, 'g');
    const emailMatched = email.match(emailPattern).join('');
    if (emailMatched.length < email.length) throw new Error('Invalid email!')
    if(title && author && email && file && (fileExt == 'png' ||  'jpg' || 'gif' ) && title.length < 26 && author.length < 51) { // if fields are not empty...
    
      escapedTitle = escape(title)

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const newPhoto = new Photo({ title: escapedTitle, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    const voter = await Voter.findOne({ user: clientIp})

    if (!voter) {
      const newVoter = new Voter({ user: clientIp, votes: photoToUpdate._id});
      await newVoter.save();
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    } else {

      if(voter.votes.includes(photoToUpdate._id)) {
        throw new Error('You have already voted...!');

      } else {
        voter.votes.push(photoToUpdate._id);
        voter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
